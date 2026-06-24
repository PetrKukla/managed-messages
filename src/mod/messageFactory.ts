import type { ComponentLine, ContentLine, FlagsLine, Updater } from '@/types';
import { MessageInstance } from '@/messageInstance';

export class MessageFactory<TData> {
    private contentLine: ContentLine<TData> | null = null;
    private componentLines: ComponentLine<TData>[] = [];
    private flagsLine: FlagsLine<TData> | null = null;
    private updater: Updater<TData> | null = null;

    public setContent(line: ContentLine<TData>): MessageFactory<TData> {
        this.contentLine = line;

        return this;
    }

    public addComponent(line: ComponentLine<TData>): MessageFactory<TData> {
        this.componentLines.push(line);

        return this;
    }

    public setFlags(line: FlagsLine<TData>): MessageFactory<TData> {
        this.flagsLine = line;

        return this;
    }

    public setUpdater(updater: Updater<TData>): MessageFactory<TData> {
        this.updater = updater;

        return this;
    }

    public instantiate(data: TData): MessageInstance<TData> {
        return new MessageInstance<TData>({
            data,
            contentLine: this.contentLine,
            componentLines: this.componentLines,
            flagsLine: this.flagsLine,
            updater: this.updater
        });
    }
}
