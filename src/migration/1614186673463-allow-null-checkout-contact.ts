import { MigrationInterface, QueryRunner } from "typeorm";

export class allowNullCheckoutContact1614186673463 implements MigrationInterface {
  name = 'allowNullCheckoutContact1614186673463'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "lineContact" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "waContact" DROP NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "lineContact" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "checkout" ALTER COLUMN "waContact" SET NOT NULL`);
  }

}
