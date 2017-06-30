import { Injectable, isDevMode } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/delay';

interface ICacheItem {
    identifier: any,
    object: any,
}

@Injectable()
export class CacheService {

    cache: { [group: string]: ICacheItem[] };
    constructor() {
        this.cache = {};
    }

    defaultTtl: number = 500000; // 5 minutes

    /** 
     * Add an item to the cache
     * @param cache group
     * @param cache item identifier
     * @param object to store
     * @param time to live or -1 for no obsoletion
     */
    addToCache(group: string, identifier: any, obj: any, ttl: number = this.defaultTtl): void {
        if (this.get(group, identifier)) {
            // already in cache, remove first
            this.removeFromCache(group, identifier);
        }
        if (!this.cache[group]) {
            this.cache[group] = new Array<ICacheItem>();
        }
        const item: ICacheItem = { identifier: identifier, object: obj };
        this.cache[group].push(item);
        if (ttl > -1) {
            let delayedObservable = Observable.of(item).delay(ttl);
            let sub = delayedObservable.subscribe(data => {
                if (isDevMode) {
                    console.log("item obsolete:");
                    console.log(item);
                }
                this.removeFromCache(group, data.identifier);
                sub.unsubscribe();
            });
        }
        if (isDevMode) {
            console.log("item added to cache:");
            console.log(this.cache);
        }
    }

    /** 
     * Gets an item from the cache
     * @param group Cache group to get the item from 
     * @param identifier Cache item identifier
     * @returns any or null if item is not in cache
     */
    get(group: string, identifier: any): any {
        if (this.cache[group] && this.cache[group].length > 0) {
            for (let item of this.cache[group]) {
                if (item.identifier === identifier) {
                    if (isDevMode) {
                        console.log("found item in cache:");
                        console.log(item);
                    }
                    return item.object;
                }
            }
            if (isDevMode) {
                console.log("item not in cache:");
                console.log(group + " " + identifier);
            }
        }
        return null;
    }

    /** 
     * Removes one or more items from cache
     * @param cache entry type, or null for all types
     * @param cache identifier, or null for all types
     * @returns Number of items removed
     */
    removeFromCache(group?: string, identifier?: any): number {
        if (!this.cache[group]) {
            return 0;
        }
        const l = this.cache[group].length;
        this.cache[group] = this.cache[group].filter((item) => {
            return (!identifier || identifier == item.identifier);
        });
        return l - this.cache[group].length;
    }

    /** 
     * Removes all cached elements
     */
    purgeCache(): void {
        this.cache = {};
    }
}
