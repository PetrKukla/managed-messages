import {
    type APIMessageTopLevelComponent,
    Guild,
    type Message,
    type TextBasedChannel
} from 'discord.js';
import {
    type ActionRowData,
    type BitFieldResolvable,
    type JSONEncodable,
    type MessageActionRowComponentBuilder,
    type MessageActionRowComponentData,
    MessageFlags,
    type TopLevelComponentData
} from 'discord.js';

export type AllowedComponents =
    | APIMessageTopLevelComponent
    | JSONEncodable<APIMessageTopLevelComponent>
    | TopLevelComponentData
    | ActionRowData<MessageActionRowComponentData | MessageActionRowComponentBuilder>
    | undefined;

export type AllowedMessageFlags =
    | BitFieldResolvable<
          'SuppressEmbeds' | 'SuppressNotifications' | 'IsComponentsV2' | 'Ephemeral',
          | MessageFlags.SuppressEmbeds
          | MessageFlags.SuppressNotifications
          | MessageFlags.IsComponentsV2
          | MessageFlags.Ephemeral
      >
    | undefined;

export type AllowedEditFlags =
    | BitFieldResolvable<
          'SuppressEmbeds' | 'IsComponentsV2',
          MessageFlags.SuppressEmbeds | MessageFlags.IsComponentsV2
      >
    | undefined;

export type ContentLine<TData> = (data: TData) => string;
export type ComponentLine<TData> = (
    data: TData,
    hooks: {
        customId: (customId: string) => string;
    }
) => AllowedComponents;
export type FlagsLine<TData> = (data: TData) => AllowedMessageFlags;

export type Updater<TData> = (
    customId: string,
    params: {
        data: TData;
        values: string[];
        close: () => Promise<void>;
        interaction: {
            guild: Guild | null;
            channel: TextBasedChannel;
            message: Message;
        };
    }
) => TData | Promise<TData>;
