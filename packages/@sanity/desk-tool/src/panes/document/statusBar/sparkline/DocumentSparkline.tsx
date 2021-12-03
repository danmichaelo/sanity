import {Box, Flex, useElementRect} from '@sanity/ui'
import React, {useEffect, useMemo, useState, useRef, memo, useCallback} from 'react'
import {useSyncState} from '@sanity/react-hooks'
import {useDocumentPane} from '../../useDocumentPane'
import {DocumentBadges} from './DocumentBadges'
import {PublishStatus} from './PublishStatus'
import {ReviewChangesButton} from './ReviewChangesButton'

export const DocumentSparkline = memo(function DocumentSparkline() {
  const {
    editState,
    historyController,
    value,
    documentId,
    documentType,
    handleHistoryClose,
    handleHistoryOpen,
    changesOpen,
  } = useDocumentPane()
  const syncState = useSyncState(documentId, documentType)

  const lastUpdated = value?._updatedAt
  const lastPublished = editState?.published?._updatedAt
  const showingRevision = historyController.onOlderRevision()
  const liveEdit = Boolean(editState?.liveEdit)
  const published = Boolean(editState?.published)
  const changed = Boolean(editState?.draft)

  const [rootFlexElement, setRootFlexElement] = useState<HTMLDivElement | null>(null)
  const rootFlexRect = useElementRect(rootFlexElement)
  const collapsed = Boolean(rootFlexRect && rootFlexRect?.width < 300)

  const initialState = changed ? 'changes' : undefined
  const [status, setStatus] = useState<'changes' | 'saved' | 'syncing' | undefined>(initialState)
  const changesTimer: {current: NodeJS.Timeout | null} = useRef(null)
  const savedTimer: {current: NodeJS.Timeout | null} = useRef(null)

  const handleSetStatus = useCallback((s) => setStatus(s), [])

  const cancelAnimation = useCallback(() => {
    if (savedTimer?.current && changesTimer?.current) {
      clearInterval(changesTimer?.current)
      clearInterval(savedTimer?.current)
    }
  }, [savedTimer, changesTimer])

  const runAnimation = useCallback(() => {
    savedTimer.current = setTimeout(() => handleSetStatus('saved'), 1000)
    changesTimer.current = setTimeout(() => handleSetStatus('changes'), 4000)
  }, [handleSetStatus])

  // Reset status and cancel animation when changing document
  useEffect(() => {
    handleSetStatus(initialState)
    setTimeout(() => {
      cancelAnimation()
    }, 1)
  }, [cancelAnimation, handleSetStatus, initialState, documentId])

  // 1. If is syncing, cancel animation and set the syncing status
  // 2. When the syncing is complete, run the animation
  useEffect(() => {
    if (syncState.isSyncing) {
      handleSetStatus('syncing')
      cancelAnimation()
    } else {
      runAnimation()
    }
  }, [syncState.isSyncing, handleSetStatus, cancelAnimation, runAnimation])

  const reviewButton = useMemo(
    () => (
      <ReviewChangesButton
        lastUpdated={lastUpdated}
        status={status}
        onClick={changesOpen ? handleHistoryClose : handleHistoryOpen}
        disabled={showingRevision}
        selected={changesOpen}
        collapsed={collapsed}
      />
    ),
    [
      changesOpen,
      handleHistoryClose,
      handleHistoryOpen,
      lastUpdated,
      showingRevision,
      status,
      collapsed,
    ]
  )

  const publishStatus = useMemo(
    () =>
      (liveEdit || published) && (
        <Box marginRight={1}>
          <PublishStatus
            disabled={showingRevision}
            lastPublished={lastPublished}
            lastUpdated={lastUpdated}
            liveEdit={liveEdit}
            collapsed={collapsed}
          />
        </Box>
      ),
    [collapsed, lastPublished, lastUpdated, liveEdit, published, showingRevision]
  )

  return (
    <Flex align="center" data-ui="DocumentSparkline" ref={setRootFlexElement}>
      {publishStatus}

      <Flex align="center" flex={1}>
        {reviewButton}
        {!collapsed && (
          <Box marginLeft={3}>
            <DocumentBadges />
          </Box>
        )}
      </Flex>
    </Flex>
  )
})
