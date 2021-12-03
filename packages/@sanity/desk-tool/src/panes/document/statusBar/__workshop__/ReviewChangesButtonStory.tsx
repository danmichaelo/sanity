import {PublishIcon} from '@sanity/icons'
import {Card, Flex, Container, TextInput, Stack, Button, Text} from '@sanity/ui'
import {useBoolean} from '@sanity/ui-workshop'
import React, {useCallback, useRef, useState} from 'react'

import {ReviewChangesButton} from '../sparkline/ReviewChangesButton'

type ChangesType = 'changes' | 'saved' | 'syncing'

const randomDelay = () => Math.floor(Math.random() * 1500) + 800

export default function ReviewChangesButtonStory() {
  const collapsed = useBoolean('Collapsed', false)
  const [text, setText] = useState<string>('')
  const [status, setStatus] = useState<ChangesType>()
  const savedTimeout: {current: NodeJS.Timeout | null} = useRef(null)
  const editedTimeout: {current: NodeJS.Timeout | null} = useRef(null)

  const handlePublish = useCallback(() => {
    setText('')
    setStatus(undefined)

    if (savedTimeout.current && editedTimeout.current) {
      clearTimeout(savedTimeout?.current)
      clearTimeout(editedTimeout?.current)
    }
  }, [])

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStatus('syncing')
      setText(e.target.value)
      const delay = randomDelay()

      if (savedTimeout.current && editedTimeout.current) {
        clearTimeout(savedTimeout?.current)
        clearTimeout(editedTimeout?.current)
      }

      savedTimeout.current = setTimeout(() => {
        setStatus('saved')

        editedTimeout.current = setTimeout(() => {
          setStatus('changes')
        }, 2000)
      }, delay)
    },
    [savedTimeout]
  )

  return (
    <Card height="fill">
      <Flex align="center" height="fill" justify="center" padding={4} sizing="border">
        <Container width={1}>
          <Stack space={7}>
            <Stack space={3}>
              <Stack space={2}>
                <Text weight="semibold" size={1}>
                  Test input
                </Text>
                <Text muted size={1}>
                  Type to test the the status button
                </Text>
              </Stack>
              <TextInput onChange={handleChange} />
            </Stack>
            <Card border padding={2}>
              <Flex align="center" justify="space-between">
                <ReviewChangesButton status={status} lastUpdated="just now" collapsed={collapsed} />

                <Button
                  text="Publish"
                  icon={PublishIcon}
                  tone="positive"
                  disabled={text.length === 0 || status === 'syncing'}
                  onClick={handlePublish}
                />
              </Flex>
            </Card>
          </Stack>
        </Container>
      </Flex>
    </Card>
  )
}
