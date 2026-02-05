import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Cron } from '@nestjs/schedule';
import { SquareClient, SquareEnvironment, CatalogObject } from 'square';
import { SquareProduct } from './entities/square-product.entity';

@Injectable()
export class SquareService implements OnModuleInit {
  private readonly CACHE_KEY_RAW = 'square-products-raw';
  private readonly CACHE_KEY_CLEAN = 'square-products-clean';
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private readonly squareClient: SquareClient;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Initialize Square client with proper config
    const environment = this.configService.get('SQUARE_ENVIRONMENT');
    const accessToken = this.configService.get('SQUARE_ACCESS_TOKEN');

    console.log(`🔧 Initializing Square client with environment: ${environment}`);

    this.squareClient = new SquareClient({
      environment: environment === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox,
      token: accessToken || '',
    });
  }

  /**
   * Cron Job to refresh cache every 50 minutes
   * This prevents the 1-hour cache from ever expiring for the user
   */
  @Cron('0 */50 * * * *') // Run every 50 minutes
  async handleCron() {
    console.log('⏰ [CRON] Refreshing Square products cache...');
    const startTime = Date.now();
    try {
      // Clear cache to force fresh fetch
      await this.cacheManager.del(this.CACHE_KEY_RAW);
      await this.cacheManager.del(this.CACHE_KEY_CLEAN);

      // Fetch fresh data
      await this.getSquareProducts();

      const duration = Date.now() - startTime;
      console.log(`✅ [CRON] Cache refreshed successfully in ${duration}ms`);
    } catch (error) {
      console.error('❌ [CRON] Failed to refresh cache:', error);
    }
  }

  /**
   * Pre-warm cache on module initialization
   */
  async onModuleInit() {
    console.log('🔥 Pre-warming Square products cache...');
    try {
      await this.getSquareProducts();
      console.log('✅ Square products cache pre-warmed successfully');
    } catch (error) {
      console.error('❌ Failed to pre-warm Square products cache:', error);
      // Don't throw - server should still start even if pre-warming fails
    }
  }

  /**
   * Get optimized products from Square with resolved references
   */
  async getSquareProducts(): Promise<SquareProduct[]> {
    // 1. Try to get from cache
    console.log(`🔍 [CACHE] Checking cache for key: ${this.CACHE_KEY_CLEAN}`);
    const cachedClean = await this.cacheManager.get<SquareProduct[]>(
      this.CACHE_KEY_CLEAN,
    );

    if (cachedClean) {
      console.log(
        `📦 [CACHE HIT] Returning cached products (${cachedClean.length} items)`,
      );
      return cachedClean;
    }

    console.log(
      '❌ [CACHE MISS] Cache is empty, fetching from Square API...',
    );

    // 2. Fetch raw products from Square API
    const rawProducts = await this.fetchFromSquare();

    // 3. Process to SquareProduct[]
    console.log('⚙️  Processing raw products to SquareProduct structure...');
    const startTime = Date.now();

    const imagesMap = new Map<string, string>();
    const categoriesMap = new Map<string, string>();

    // Build Maps for faster lookup
    rawProducts.forEach((obj: any) => {
      if (obj.type === 'IMAGE' && obj.imageData?.url) {
        imagesMap.set(obj.id, obj.imageData.url);
      } else if (obj.type === 'CATEGORY' && obj.categoryData?.name) {
        categoriesMap.set(obj.id, obj.categoryData.name);
      }
    });

    const squareProducts: SquareProduct[] = rawProducts
      .filter((p: any) => p.type === 'ITEM')
      .map((p: any) => {
        const itemData = p.itemData;
        const variation = itemData?.variations?.[0];
        const variationData = variation?.itemVariationData;

        // Resolve Category
        let categoryName: string | undefined = undefined;
        const categoryId = itemData?.categoryId;
        if (categoryId) {
          categoryName = categoriesMap.get(categoryId);
        }

        // Resolve Image
        let imageUrl: string | undefined = undefined;
        const imageIds = itemData?.imageIds;
        if (Array.isArray(imageIds) && imageIds.length > 0) {
          imageUrl = imagesMap.get(imageIds[0]);
        }

        // Extract Brand from custom attributes
        let brand: string | undefined = undefined;
        let customAttrs = [];
        if (variation?.customAttributeValues) {
          customAttrs = Object.values(variation.customAttributeValues);
        }

        customAttrs.forEach((attr: any) => {
          const attrName = (attr.name || attr.key || '').toLowerCase();
          const attrVal = attr.stringValue || attr.value || '';
          if (attrName.includes('brand')) brand = attrVal || undefined;
        });

        // Map Variations
        const variations = (itemData?.variations || []).map((v: any) => ({
          id: v.id,
          name: v.itemVariationData?.name || 'Regular',
          sku: v.itemVariationData?.sku || 'N/A',
          price: v.itemVariationData?.priceMoney?.amount
            ? Number(v.itemVariationData.priceMoney.amount) / 100
            : 0,
        }));

        const price = variationData?.priceMoney?.amount
          ? Number(variationData.priceMoney.amount) / 100
          : 0;

        return {
          id: p.id,
          name: itemData?.name || 'Unknown Product',
          description:
            itemData?.description ||
            itemData?.descriptionPlaintext ||
            'No description provided.',
          price,
          category: categoryName,
          image: imageUrl,
          brand,
          sku: variationData?.sku || 'N/A',
          stock: 0, // Square doesn't provide stock in catalog API
          variations,
        };
      });

    const duration = Date.now() - startTime;
    console.log(
      `✅ Converted ${squareProducts.length} items to SquareProduct in ${duration}ms`,
    );

    // 4. Cache the result
    await this.cacheManager.set(
      this.CACHE_KEY_CLEAN,
      squareProducts,
      this.CACHE_TTL,
    );
    console.log('💾 Products cached successfully');

    return squareProducts;
  }

  /**
   * Fetch raw products from Square API with retry logic
   */
  private async fetchFromSquare(): Promise<CatalogObject[]> {
    const cachedRaw = await this.cacheManager.get<CatalogObject[]>(
      this.CACHE_KEY_RAW,
    );
    if (cachedRaw) {
      console.log('📦 Using cached raw products from Square');
      return cachedRaw;
    }

    console.log('🔄 Fetching products from Square API...');
    const products: CatalogObject[] = [];
    let cursor: string | undefined = undefined;
    const startTime = Date.now();

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000; // Start with 2 seconds

    try {
      do {
        let retryCount = 0;
        let success = false;
        let response: any;

        while (retryCount < MAX_RETRIES && !success) {
          try {
            response = await this.squareClient.catalog.search({
              objectTypes: ['ITEM', 'ITEM_VARIATION', 'IMAGE', 'CATEGORY'],
              limit: 100,
              cursor,
            });
            success = true;
          } catch (error: any) {
            retryCount++;

            // Check if error is transient
            const isTransientError =
              error.statusCode === 503 ||
              error.message?.includes('upstream connect error') ||
              error.message?.includes('connection termination') ||
              error.message?.includes('ECONNRESET') ||
              error.message?.includes('ETIMEDOUT');

            if (isTransientError && retryCount < MAX_RETRIES) {
              const delay = RETRY_DELAY_MS * Math.pow(2, retryCount - 1);
              console.warn(
                `⚠️ Square API error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`,
              );
              console.log(`⏳ Retrying in ${delay}ms...`);
              await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
              throw error;
            }
          }
        }

        if (response?.objects) {
          products.push(...response.objects);
        }

        cursor = response?.cursor;
      } while (cursor);

      const duration = Date.now() - startTime;
      console.log(
        `✅ Fetched ${products.length} products from Square in ${duration}ms`,
      );

      await this.cacheManager.set(
        this.CACHE_KEY_RAW,
        products,
        this.CACHE_TTL,
      );
      console.log('💾 Raw products cached successfully');

      return products;
    } catch (error: any) {
      console.error('❌ Error fetching products from Square:', error);

      let errorMessage = 'Failed to fetch products from Square.';

      if (error.statusCode === 503) {
        errorMessage =
          'Square service is temporarily unavailable. Please try again in a few minutes.';
      } else if (
        error.message?.includes('upstream connect error') ||
        error.message?.includes('connection termination')
      ) {
        errorMessage =
          'Network connection error with Square API. Please try again later.';
      } else if (
        error.message?.includes('ECONNRESET') ||
        error.message?.includes('ETIMEDOUT')
      ) {
        errorMessage =
          'Connection timeout with Square API. Please check your network connection and try again.';
      } else if (error.statusCode === 401 || error.statusCode === 403) {
        errorMessage =
          'Authentication error with Square API. Please verify API credentials.';
      } else if (error instanceof Error) {
        console.error('Unexpected error:', error.message);
        errorMessage = `Square API error: ${error.message}`;
      }

      throw new Error(errorMessage);
    }
  }
}
