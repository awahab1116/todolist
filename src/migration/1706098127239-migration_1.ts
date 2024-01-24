import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration11706098127239 implements MigrationInterface {
    name = 'Migration11706098127239'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`active\` tinyint NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`active\``);
    }

}
