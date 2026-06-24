import type { ComponentLine, ContentLine, Updater, FlagsLine, AllowedEditFlags } from '@/types';
import {
    type AnySelectMenuInteraction,
    type ButtonInteraction,
    type CommandInteraction,
    type InteractionReplyOptions,
    type Message,
    type MessageCreateOptions,
    MessageFlags,
    type TextChannel
} from 'discord.js';

export enum RenderMode {
    SendMessage,
    InteractionReply,
    Edit
}

export class MessageInstance<TData> {
    // Maps guildId to a Map that maps customId to MessageInstance
    // TODO: This is dumb implementation.
    private static map: Map<string, MessageInstance<any>> = new Map();

    private readonly contentLine: ContentLine<TData> | null;
    private readonly componentLines: ComponentLine<TData>[];
    private readonly flagsLine: FlagsLine<TData> | null;
    private updater: Updater<TData> | null = null;
    private message: Message | null = null;
    private customIds: string[] = [];

    public data: TData;

    public static async onInteractionCreate(inter: ButtonInteraction | AnySelectMenuInteraction) {
        await inter.deferUpdate();

        const instance = MessageInstance.map.get(inter.message.id);

        if (!instance?.updater) return;

        const customId = inter.customId;

        let values: string[] = [];

        if (inter.isAnySelectMenu()) {
            values = [...inter.values];
        }

        instance.data = await instance.updater(customId, {
            data: instance.data,
            values,
            close: async () => await instance.delete(),
            interaction: {
                guildId: inter.guildId,
                channelId: inter.channelId,
                messageId: inter.message.id
            }
        });

        instance.message?.edit(instance.render(RenderMode.Edit));
    }

    public constructor(init: {
        data: TData;
        contentLine: ContentLine<TData> | null;
        componentLines: ComponentLine<TData>[];
        flagsLine: FlagsLine<TData> | null;
        updater: Updater<TData> | null;
    }) {
        this.contentLine = init.contentLine;
        this.componentLines = init.componentLines;
        this.flagsLine = init.flagsLine;
        this.updater = init.updater;

        this.data = init.data;
    }

    public render(
        mode: RenderMode.Edit
    ): Omit<MessageCreateOptions, 'flags'> & { flags: AllowedEditFlags };

    public render(mode?: RenderMode): MessageCreateOptions;

    public render(
        mode?: RenderMode
    ): MessageCreateOptions | (Omit<MessageCreateOptions, 'flags'> & { flags: AllowedEditFlags }) {
        let flags = this.flagsLine?.(this.data);

        if (flags && mode == RenderMode.Edit) {
            if (flags === 'SuppressNotifications') {
                flags = undefined;
            } else if (
                (typeof flags === 'bigint' || typeof flags === 'number') &&
                (flags & MessageFlags.SuppressNotifications) !== 0
            ) {
                flags = flags & ~MessageFlags.SuppressNotifications;
            }
        }

        return {
            content: this.contentLine?.(this.data),
            components: this.componentLines
                .map((line) =>
                    line(this.data, {
                        customId: (customId) => {
                            this.customIds.push(customId);

                            return customId;
                        }
                    })
                )
                .filter((c) => c !== undefined),
            flags: flags
        };
    }

    /**
     * Can be only called once
     * @throws Error
     * */
    public async send(context: {
        channel?: TextChannel;
        interaction?: CommandInteraction;
    }): Promise<string> {
        if (this.message) {
            throw new Error('Message is already alive.');
        }

        if (context.interaction) {
            const reply = await context.interaction.reply({
                ...(this.render() as InteractionReplyOptions),
                withResponse: true
            });

            this.message = reply.resource?.message ?? null;

            if (!this.message) {
                throw new Error('Something went wrong when replying to interaction.');
            }
        } else if (context.channel) {
            this.message = await context.channel.send(this.render());
        } else {
            throw new Error('No context provided.');
        }

        MessageInstance.map.set(this.message.id, this);

        return this.message.id;
    }

    public async recover(message: Message) {
        this.message = message;

        MessageInstance.map.set(this.message.id, this);

        await this.message.edit(this.render(RenderMode.Edit));
    }

    public async delete() {
        await this.message?.delete();

        this.message = null;
    }
}
