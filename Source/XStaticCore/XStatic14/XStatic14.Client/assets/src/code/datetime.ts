/** A date as the API sends it (an ISO string), a timestamp or a `Date`. */
export type DateInput = string | number | Date;

export function formatDate(date: DateInput) {
    return new Date(date).toLocaleDateString();
}

export function formatTime(date: DateInput) {
    return new Date(date).toLocaleTimeString();
}

/** Formats a number of seconds as "m:ss" or "h:mm:ss". */
export function formatDuration(duration: number | null | undefined) {
    if (!duration) {
        return "0:00";
    }

    // Hours, minutes and seconds
    const hrs = ~~(duration / 3600);
    const mins = ~~((duration % 3600) / 60);
    const secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    let ret = "";

    if (hrs > 0) {
        ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
    }

    ret += "" + mins + ":" + (secs < 10 ? "0" : "");
    ret += "" + secs;
    return ret;
}
