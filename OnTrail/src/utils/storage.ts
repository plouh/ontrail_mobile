import { lift } from 'fp-ts/lib/Functor'
import { fromNullable, Option, option, none, some } from 'fp-ts/lib/Option'
import { AsyncStorage } from 'react-native'
import { Task } from 'fp-ts/lib/Task'

function save<T>(key: string, value: T|null): Task<Option<T>> {
    if (value === null) {
        return new Task<Option<T>>(() => AsyncStorage.removeItem(key).then(_ => none))
    }
    return new Task<Option<T>>(() => 
        AsyncStorage.setItem(key, JSON.stringify(value)).then(_ => some(value))
    )
}

function load<T>(key: string): Task<Option<T>> {
    return new Task<string|null>(() => AsyncStorage.getItem(key))
        .map(fromNullable)
        .map(lift(option)<string, T>(JSON.parse))
}

export interface IStorage<T> {
    get(): Task<Option<T>>
    set(value: T): Task<Option<T>>
}

export function storage<T>(key: string): IStorage<T> {
    return {
        get: () => load(key),
        set: (value: T) => save(key, value)
    }
}
