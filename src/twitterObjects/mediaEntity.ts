import Size from "./size";

/* tslint:disable:variable-name */
export default class MediaEntity {
    public id: number;
    public id_str: string;
    public indices: number[];
    public media_url: string;
    public media_url_https: string;
    public url: string;
    public display_url: string;
    public expanded_url: string;
    public type: string;
    public sizes: {
        medium: Size;
        small: Size;
        thumb: Size;
        large: Size;
    };
}
/* tslint:enable:variable-name */
