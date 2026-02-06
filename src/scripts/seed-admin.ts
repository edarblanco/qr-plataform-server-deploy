import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../users/schemas/user.schema';
import { Role } from '../auth/enums/role.enum';
import { UserAvailability } from '../users/schemas/user.schema';

/**
 * Script para crear un usuario administrador inicial
 *
 * Uso:
 *   yarn seed:admin
 *
 * Credenciales por defecto:
 *   Email: admin@luxapatio.com
 *   Password: Admin123!
 */
async function bootstrap() {
  console.log('🌱 Iniciando seed de usuario administrador...\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  const userModel = app.get<Model<User>>(getModelToken(User.name));

  // Datos del administrador
  const adminData = {
    email: 'admin@luxapatio.com',
    password: 'Admin123!',
    name: 'Administrador',
    role: Role.ADMIN,
    availability: UserAvailability.AVAILABLE,
  };

  try {
    // Verificar si ya existe
    const existingAdmin = await userModel.findOne({ email: adminData.email });

    if (existingAdmin) {
      console.log('⚠️  El usuario administrador ya existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nombre: ${existingAdmin.name}`);
      console.log(`   Rol: ${existingAdmin.role}`);
      console.log('\n💡 Si olvidaste la contraseña, elimina el usuario de MongoDB y vuelve a ejecutar este script.\n');
      await app.close();
      return;
    }

    // Hashear password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Crear administrador
    const admin = new userModel({
      ...adminData,
      password: hashedPassword,
    });

    await admin.save();

    console.log('✅ Usuario administrador creado exitosamente!\n');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 Nombre:', adminData.name);
    console.log('🛡️  Rol:', adminData.role);
    console.log('\n⚠️  IMPORTANTE: Cambia la contraseña después del primer login!\n');

  } catch (error) {
    console.error('❌ Error al crear administrador:', error.message);
    process.exit(1);
  }

  await app.close();
  console.log('✨ Seed completado.\n');
  process.exit(0);
}

bootstrap();
