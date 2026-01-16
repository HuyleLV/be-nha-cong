import { format, transports } from 'winston';
import { WinstonModuleOptions } from 'nest-winston';

export const loggerConfig: WinstonModuleOptions = {
    transports: [
        // Console transport
        new transports.Console({
            format: format.combine(
                format.timestamp(),
                format.ms(),
                format.colorize(),
                format.printf(({ timestamp, level, message, ms, context }) => {
                    return `${timestamp} [${level}] [${context || 'Application'}] ${message} ${ms}`;
                }),
            ),
        }),
        // File transport for errors
        new transports.File({
            filename: 'logs/error.log',
            level: 'error',
            format: format.combine(format.timestamp(), format.json()),
        }),
        // File transport for all logs
        new transports.File({
            filename: 'logs/combined.log',
            format: format.combine(format.timestamp(), format.json()),
        }),
    ],
};
