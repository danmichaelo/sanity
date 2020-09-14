import React from 'react'
import DefaultFormField from 'part:@sanity/components/formfields/default'
import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import ImageLoader from 'part:@sanity/components/utilities/image-loader'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'
import PatchEvent, {set} from '../../PatchEvent'
import {Type} from '../../typedefs'

import styles from './styles/ImageToolInput.css'

interface Hotspot {
  x: number
  y: number
  height: number
  width: number
}

interface Crop {
  left: number
  right: number
  top: number
  bottom: number
}

interface Value {
  hotspot?: Hotspot
  crop?: Crop
}

interface ImageToolInputProps {
  imageUrl: string
  value?: Value
  onChange: (arg0: PatchEvent) => void
  readOnly: boolean | null
  level: number
  type: Type
}

interface ImageToolInputState {
  value: any
}

const PREVIEW_ASPECT_RATIOS = [
  ['3:4', 3 / 4],
  ['Square', 1 / 1],
  ['16:9', 16 / 9],
  ['Panorama', 4 / 1]
]

export default class ImageToolInput extends React.Component<
  ImageToolInputProps,
  ImageToolInputState
> {
  constructor(props: ImageToolInputProps) {
    super(props)
    this.state = {
      value: props.value
    }
  }

  handleChangeEnd = () => {
    const {onChange, readOnly, type} = this.props
    const {value} = this.state

    // For backwards compatibility, where hotspot/crop might not have a named type yet
    const cropField = type.fields.find(
      field => field.name === 'crop' && field.type.name !== 'object'
    )

    const hotspotField = type.fields.find(
      field => field.name === 'hotspot' && field.type.name !== 'object'
    )

    if (!readOnly) {
      const crop = cropField ? {_type: cropField.type.name, ...value.crop} : value.crop
      const hotspot = hotspotField
        ? {_type: hotspotField.type.name, ...value.hotspot}
        : value.hotspot

      onChange(PatchEvent.from([set(crop, ['crop']), set(hotspot, ['hotspot'])]))
    }
  }

  handleChange = (nextValue: Value) => {
    this.setState({value: nextValue})
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps: ImageToolInputProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({value: nextProps.value})
    }
  }

  render() {
    const {imageUrl, level, readOnly} = this.props
    const {value} = this.state

    return (
      // @todo: render presence and markers
      <DefaultFormField
        // label?: string
        label="Hotspot &amp; crop"
        // className?: string
        // inline?: boolean
        // description?: string
        // level?: number
        level={level}
        // children?: React.ReactNode
        // wrapped?: boolean
        // labelFor?: string
        // markers?: Marker[]
        // presence?: FormFieldPresence[]
      >
        <div className={styles.imageToolContainer}>
          <div>
            <div>
              <ImageTool
                value={value}
                src={imageUrl}
                readOnly={readOnly}
                onChangeEnd={this.handleChangeEnd}
                onChange={this.handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.previewsContainer}>
          <ImageToolInputPreviewGrid imageUrl={imageUrl} value={value} />
        </div>
      </DefaultFormField>
    )
  }
}

function ImageToolInputPreviewGrid({imageUrl, value}: {imageUrl: string; value: any}) {
  return (
    <div className={styles.previews}>
      {PREVIEW_ASPECT_RATIOS.map(([title, ratio]) => (
        <ImageToolInputPreviewItem
          key={ratio}
          imageUrl={imageUrl}
          ratio={ratio}
          title={title}
          value={value}
        />
      ))}
    </div>
  )
}

function ImageToolInputPreviewItem({
  imageUrl,
  ratio,
  title,
  value
}: {
  imageUrl: string
  ratio: string | number
  title: string | number
  value: any
}) {
  return (
    <div key={ratio} className={styles.preview}>
      <h4>{title}</h4>

      <div className={styles.previewImage}>
        <ImageLoader src={imageUrl}>
          {({image, error}) =>
            error ? (
              <span>Unable to load image: {error.message}</span>
            ) : (
              <HotspotImage
                aspectRatio={ratio}
                src={image.src}
                srcAspectRatio={image.width / image.height}
                hotspot={value.hotspot || DEFAULT_HOTSPOT}
                crop={value.crop || DEFAULT_CROP}
              />
            )
          }
        </ImageLoader>
      </div>
    </div>
  )
}
