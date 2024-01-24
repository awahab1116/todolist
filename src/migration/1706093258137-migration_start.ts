import { MigrationInterface, QueryRunner } from "typeorm";

export class MigrationStart1706093258137 implements MigrationInterface {
    name = 'MigrationStart1706093258137'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`profileImage\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`otp\` int NULL, \`otpExpirationTime\` datetime NULL, \`loginType\` enum ('simple-login', 'facebook-login') NOT NULL DEFAULT 'simple-login', \`updatedAt\` datetime NOT NULL, \`createdAt\` datetime NOT NULL, UNIQUE INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`task\` (\`id\` int NOT NULL AUTO_INCREMENT, \`creationDateTime\` datetime NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`completionStatus\` tinyint NOT NULL DEFAULT 0, \`dueDateTime\` datetime NOT NULL, \`completionDateTime\` datetime NULL, \`userId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`my_file\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`data\` longblob NOT NULL, \`mimeType\` varchar(255) NOT NULL, \`taskId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`task\` ADD CONSTRAINT \`FK_f316d3fe53497d4d8a2957db8b9\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`my_file\` ADD CONSTRAINT \`FK_e69934cdb875972e435f8db820b\` FOREIGN KEY (\`taskId\`) REFERENCES \`task\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`my_file\` DROP FOREIGN KEY \`FK_e69934cdb875972e435f8db820b\``);
        await queryRunner.query(`ALTER TABLE \`task\` DROP FOREIGN KEY \`FK_f316d3fe53497d4d8a2957db8b9\``);
        await queryRunner.query(`DROP TABLE \`my_file\``);
        await queryRunner.query(`DROP TABLE \`task\``);
        await queryRunner.query(`DROP INDEX \`IDX_e12875dfb3b1d92d7d7c5377e2\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
    }

}
