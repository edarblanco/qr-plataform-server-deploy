import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { LeadsService } from '../leads/leads.service';
import { LeadStatus } from '../leads/schemas/lead.schema';
import mongoose from 'mongoose';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const leadsService = app.get(LeadsService);

  console.log('Iniciando validación de leads...');

  try {
    const leads = await leadsService.findAll();
    console.log(`Se encontraron ${leads.length} leads total.`);

    let errors = 0;
    for (const lead of leads) {
      try {
        console.log(`Validando lead ${lead._id} (${lead.status})...`);

        // Simular la populación que hace GraphQL
        // @ts-ignore
        if (
          lead.productId &&
          !mongoose.Types.ObjectId.isValid(lead.productId)
        ) {
          console.error(
            `ERROR: Lead ${lead._id} tiene productId inválido: ${lead.productId}`,
          );
          errors++;
        }

        // @ts-ignore
        if (
          lead.assignedTo &&
          !mongoose.Types.ObjectId.isValid(lead.assignedTo)
        ) {
          console.error(
            `ERROR: Lead ${lead._id} tiene assignedTo inválido: ${lead.assignedTo}`,
          );
          errors++;
        }

        // @ts-ignore
        if (
          lead.customerId &&
          !mongoose.Types.ObjectId.isValid(lead.customerId)
        ) {
          console.error(
            `ERROR: Lead ${lead._id} tiene customerId inválido: ${lead.customerId}`,
          );
          errors++;
        }

        // Simular acceso a propiedades virtuales o métodos
        if (lead.items && !Array.isArray(lead.items)) {
          console.error(
            `ERROR: Lead ${lead._id} tiene items inválido (no es array)`,
          );
          errors++;
        }

        // Check queuePosition
        if (
          lead.queuePosition !== undefined &&
          lead.queuePosition !== null &&
          typeof lead.queuePosition !== 'number'
        ) {
          console.error(
            `ERROR: Lead ${lead._id} tiene queuePosition inválido: ${lead.queuePosition}`,
          );
          errors++;
        }
      } catch (err: any) {
        console.error(`Excepción validando lead ${lead._id}:`, err.message);
        errors++;
      }
    }

    if (errors === 0) {
      console.log('✅ Todos los leads parecen válidos en estructura básica.');
    } else {
      console.error(
        `❌ Se encontraron ${errors} leads con posibles problemas.`,
      );
    }
  } catch (error) {
    console.error('Error general al obtener leads:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
