import { UmbModalToken } from "@umbraco-cms/backoffice/modal";

export interface TimeCustomModalData {
    headline: string;
    content: string;
}

export interface TimeCustomModalValue {
    content: string
}

export const TIME_CUSTOM_MODAL = new UmbModalToken<TimeCustomModalData, TimeCustomModalValue>(
    "time.custom.modal",
    {
        modal: {
            type: 'sidebar',
            size: 'medium'
        }
    }
);
