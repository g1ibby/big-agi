import * as React from 'react';
import { shallow } from 'zustand/shallow';

import { Avatar, Box, IconButton, ListItemDecorator, MenuItem, Typography } from '@mui/joy';
import { SxProps } from '@mui/joy/styles/types';
import CloseIcon from '@mui/icons-material/Close';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { SystemPurposes } from '../../../../data';

import { InlineTextarea } from '~/common/components/InlineTextarea';
import { conversationTitle, DConversationId, useChatStore } from '~/common/state/store-chats';
import { useUIPreferencesStore } from '~/common/state/store-ui';


const DEBUG_CONVERSATION_IDs = false;


export function ConversationItem(props: {
  conversationId: DConversationId,
  isActive: boolean,
  isLonely: boolean,
  maxChatMessages: number,
  showSymbols: boolean,
  onConversationActivate: (conversationId: DConversationId, closeMenu: boolean) => void,
  onConversationDelete: (conversationId: DConversationId) => void,
}) {

  // state
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);
  const [deleteArmed, setDeleteArmed] = React.useState(false);

  // external state
  const doubleClickToEdit = useUIPreferencesStore(state => state.doubleClickToEdit);

  // bind to conversation
  const cState = useChatStore(state => {
    const conversation = state.conversations.find(conversation => conversation.id === props.conversationId);
    return conversation && {
      isNew: conversation.messages.length === 0,
      messageCount: conversation.messages.length,
      assistantTyping: !!conversation.abortController,
      systemPurposeId: conversation.systemPurposeId,
      title: conversationTitle(conversation, 'new conversation'),
      setUserTitle: state.setUserTitle,
    };
  }, shallow);

  // auto-close the arming menu when clicking away
  // NOTE: there currently is a bug (race condition) where the menu closes on a new item right after opening
  //       because the isActive prop is not yet updated
  React.useEffect(() => {
    if (deleteArmed && !props.isActive)
      setDeleteArmed(false);
  }, [deleteArmed, props.isActive]);

  // sanity check: shouldn't happen, but just in case
  if (!cState) return null;
  const { isNew, messageCount, assistantTyping, setUserTitle, systemPurposeId, title } = cState;


  const handleConversationActivate = () => props.onConversationActivate(props.conversationId, true);

  const handleTitleEdit = () => setIsEditingTitle(true);

  const handleTitleEdited = (text: string) => {
    setIsEditingTitle(false);
    setUserTitle(props.conversationId, text);
  };

  const handleDeleteButtonShow = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (!props.isActive)
      props.onConversationActivate(props.conversationId, false);
    else
      setDeleteArmed(true);
  };

  const handleDeleteButtonHide = () => setDeleteArmed(false);

  const handleConversationDelete = (event: React.MouseEvent) => {
    if (deleteArmed) {
      setDeleteArmed(false);
      event.stopPropagation();
      props.onConversationDelete(props.conversationId);
    }
  };


  const textSymbol = SystemPurposes[systemPurposeId]?.symbol || '❓';
  const buttonSx: SxProps = { ml: 1, ...(props.isActive ? { color: 'white' } : {}) };

  const progress = props.maxChatMessages ? 100 * messageCount / props.maxChatMessages : 0;

  return (
    <MenuItem
      variant={props.isActive ? 'solid' : 'plain'} color='neutral'
      selected={props.isActive}
      onClick={handleConversationActivate}
      sx={{
        // py: 0,
        position: 'relative',
        border: 'none', // note, there's a default border of 1px and invisible.. hmm
        '&:hover > button': { opacity: 1 },
      }}
    >

      {/* Optional prgoress bar */}
      {progress > 0 && (
        <Box sx={{
          backgroundColor: 'neutral.softActiveBg',
          position: 'absolute', left: 0, bottom: 0, width: progress + '%', height: 4,
        }} />
      )}

      {/* Icon */}
      {props.showSymbols && <ListItemDecorator>
        {assistantTyping
          ? (
            <Avatar
              alt='typing' variant='plain'
              src='https://i.giphy.com/media/jJxaUysjzO9ri/giphy.webp'
              sx={{
                width: 24,
                height: 24,
                borderRadius: 'var(--joy-radius-sm)',
              }}
            />
          ) : (
            <Typography sx={{ fontSize: '18px' }}>
              {isNew ? '' : textSymbol}
            </Typography>
          )}
      </ListItemDecorator>}

      {/* Text */}
      {!isEditingTitle ? (

        <Box onDoubleClick={() => doubleClickToEdit ? handleTitleEdit() : null} sx={{ flexGrow: 1 }}>
          {DEBUG_CONVERSATION_IDs ? props.conversationId.slice(0, 10) : title}{assistantTyping && '...'}
        </Box>

      ) : (

        <InlineTextarea initialText={title} onEdit={handleTitleEdited} sx={{ ml: -1.5, mr: -0.5, flexGrow: 1 }} />

      )}

      {/* // TODO: Commented code */}
      {/* Edit */}
      {/*<IconButton*/}
      {/*  variant='plain' color='neutral'*/}
      {/*  onClick={() => props.onEditTitle(props.conversationId)}*/}
      {/*  sx={{*/}
      {/*    opacity: 0, transition: 'opacity 0.3s', ml: 'auto',*/}
      {/*  }}>*/}
      {/*  <EditIcon />*/}
      {/*</IconButton>*/}

      {/* Delete Arming */}
      {!props.isLonely && !deleteArmed && (
        <IconButton
          variant={props.isActive ? 'solid' : 'outlined'} color='neutral'
          size='sm' sx={{ opacity: { xs: 1, sm: 0 }, transition: 'opacity 0.3s', ...buttonSx }}
          onClick={handleDeleteButtonShow}>
          <DeleteOutlineIcon />
        </IconButton>
      )}

      {/* Delete / Cancel buttons */}
      {!props.isLonely && deleteArmed && <>
        <IconButton size='sm' variant='solid' color='danger' sx={buttonSx} onClick={handleConversationDelete}>
          <DeleteOutlineIcon />
        </IconButton>
        <IconButton size='sm' variant='solid' color='neutral' sx={buttonSx} onClick={handleDeleteButtonHide}>
          <CloseIcon />
        </IconButton>
      </>}
    </MenuItem>

  );
}