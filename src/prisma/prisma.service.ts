import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from 'src/generated/prisma/client'
import 'dotenv/config'

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(PrismaService.name)
  constructor() {
    const connectionString = process.env.DATABASE_URL

    const adapter = new PrismaPg({ connectionString })

    super({ adapter })
  }

  async onModuleInit() {
    try {
      await this.$connect()
      this.logger.log('Connected to the database')
    } catch (error) {
      this.logger.error('Error connecting to the database', error)
      throw error
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect()
      this.logger.log('Disconnected from the database')
    } catch (error) {
      this.logger.error('Error disconnecting from the database', error)
      throw error
    }
  }
}
