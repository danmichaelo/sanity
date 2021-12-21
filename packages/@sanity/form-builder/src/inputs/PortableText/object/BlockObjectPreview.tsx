import {IntentLink} from '@sanity/base/router'
import {EditIcon, LinkIcon, TrashIcon, EyeOpenIcon, EllipsisVerticalIcon} from '@sanity/icons'
import {
  PortableTextBlock,
  PortableTextEditor,
  Type,
  usePortableTextEditor,
} from '@sanity/portable-text-editor'
import {
  Box,
  Button,
  Flex,
  Menu,
  MenuButton,
  MenuButtonProps,
  MenuItem,
  useGlobalKeyDown,
} from '@sanity/ui'
import React, {forwardRef, useCallback, useMemo, useRef} from 'react'
import {useId} from '@reach/auto-id'
import Preview from '../../../Preview'

interface BlockObjectPreviewProps {
  focused: boolean
  type: Type
  value: PortableTextBlock
  readOnly: boolean
  onClickingEdit: () => void
  onClickingDelete: () => void
}

const POPOVER_PROPS: MenuButtonProps['popover'] = {
  constrainSize: true,
  placement: 'bottom',
  portal: 'default',
  tone: 'default',
}

export function BlockObjectPreview(props: BlockObjectPreviewProps) {
  const {focused, value, type, readOnly, onClickingEdit, onClickingDelete} = props
  const editor = usePortableTextEditor()
  const menuButtonId = useId()
  const previewMenu = useRef<HTMLElement>()
  const isTabbing = useRef<boolean>(false)
  const isCustomPreviewComponent = Boolean(type.preview?.component)
  const layout = 'block'

  const referenceLink = useMemo(
    () =>
      forwardRef(function ReferenceLink(linkProps: any, ref: any) {
        return <IntentLink {...linkProps} intent="edit" params={{id: value._ref}} ref={ref} />
      }),
    [value?._ref]
  )

  // Go to menu when tabbed to
  // Focus block on escape
  useGlobalKeyDown(
    useCallback(
      (event) => {
        if (!focused) {
          return
        }
        if (event.key === 'Escape' && open) {
          event.preventDefault()
          event.stopPropagation()
          isTabbing.current = false
          PortableTextEditor.focus(editor)
        }
        if (event.key === 'Tab' && open) {
          if (previewMenu.current && !isTabbing.current) {
            event.preventDefault()
            event.stopPropagation()
            previewMenu.current.focus()
            isTabbing.current = true
          }
        }
      },
      [focused, editor]
    )
  )

  const actions = (
    <MenuButton
      button={
        <Button fontSize={1} iconRight={EllipsisVerticalIcon} mode="bleed" aria-label="Open menu" />
      }
      id={menuButtonId}
      menu={
        <Menu ref={previewMenu}>
          {value?._ref && (
            <MenuItem as={referenceLink} data-as="a" icon={LinkIcon} text="Open reference" />
          )}
          {readOnly && <MenuItem icon={EyeOpenIcon} onClick={onClickingEdit} text="View" />}
          {!readOnly && <MenuItem icon={EditIcon} onClick={onClickingEdit} text="Edit" />}
          {!readOnly && (
            <MenuItem icon={TrashIcon} onClick={onClickingDelete} text="Delete" tone="critical" />
          )}
        </Menu>
      }
      popover={POPOVER_PROPS}
    />
  )

  if (isCustomPreviewComponent) {
    return (
      <Flex>
        <Box flex={1}>
          <Preview type={type} value={value} layout={layout} />
        </Box>
        <Box marginLeft={1}>{actions}</Box>
      </Flex>
    )
  }

  return <Preview actions={actions} type={type} value={value} layout={layout} />
}
