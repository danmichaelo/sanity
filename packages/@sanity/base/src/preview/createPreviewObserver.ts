import {Observable, of as observableOf} from 'rxjs'
import {map, switchMap} from 'rxjs/operators'
import {isReferenceSchemaType, PreviewValue, SchemaType} from '@sanity/types'
import {isPlainObject} from 'lodash'
import prepareForPreview, {invokePrepare} from './utils/prepareForPreview'
import type {Path, PrepareViewOptions} from './types'
import {getPreviewPaths} from './utils/getPreviewPaths'
import {observeDocumentTypeFromId} from './observeDocumentTypeFromId'
import {Previewable} from './types'

export interface PreparedSnapshot {
  type?: SchemaType
  snapshot: undefined | PreviewValue
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value)
}

export function isReference(value: unknown): value is {_ref: string} {
  return isPlainObject(value)
}

// Takes a value and its type and prepares a snapshot for it that can be passed to a preview component
export function createPreviewObserver(observePaths: (value: Previewable, paths: Path[]) => any) {
  return function observeForPreview(
    value: Previewable,
    type: SchemaType,
    viewOptions?: PrepareViewOptions
  ): Observable<PreparedSnapshot> {
    if (isReferenceSchemaType(type)) {
      // if the value is of type reference, but has no _ref property, we cannot prepare any value for the preview
      // and the most appropriate thing to do is to return `undefined` for snapshot
      if (!isReference(value)) {
        return observableOf({snapshot: undefined})
      }
      // Previewing references actually means getting the referenced value,
      // and preview using the preview config of its type
      // todo: We need a way of knowing the type of the referenced value by looking at the reference record alone
      return observeDocumentTypeFromId(value._ref).pipe(
        switchMap((typeName) => {
          if (typeName) {
            const refType = type.to.find((toType) => toType.name === typeName)
            return observeForPreview(value, refType)
          }
          // todo: in case we can't read the document type, we can figure out the reason why e.g. whether it's because
          //  the document doesn't exist or it's not readable due to lack of permission.
          //  We can use the "observeDocumentAvailability" function
          //  for this, but currently not sure if needed
          return observableOf({snapshot: undefined})
        })
      )
    }

    const paths = getPreviewPaths(type)
    if (paths) {
      return observePaths(value, paths).pipe(
        map((snapshot) => ({
          type: type,
          snapshot: snapshot && prepareForPreview(snapshot, type, viewOptions),
        }))
      )
    }

    // Note: this case is typically rare (or non-existent) and occurs only if
    // the SchemaType doesn't have a `select` field. The schema compiler
    // provides a default `preview` implementation for `object`s, `image`s,
    // `file`s, and `document`s
    return observableOf({
      type,
      snapshot:
        value && isRecord(value) ? invokePrepare(type, value, viewOptions).returnValue : null,
    })
  }
}
