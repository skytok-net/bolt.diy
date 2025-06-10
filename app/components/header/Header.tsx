import { useStore } from '@nanostores/react';
import { ClientOnly } from 'remix-utils/client-only';
import { chatStore } from '~/lib/stores/chat';
import { classNames } from '~/utils/classNames';
import { HeaderActionButtons } from './HeaderActionButtons.client';
import { ChatDescription } from '~/lib/persistence/ChatDescription.client';
import { toggleMenu } from '~/lib/stores/menu';

export function Header() {
  const chat = useStore(chatStore);

  return (
    <header
      className={classNames('flex items-center px-4 border-b h-[var(--header-height)]', {
        'border-transparent': !chat.started,
        'border-bolt-elements-borderColor': chat.started,
      })}
    >
      <div className="flex items-center gap-2 z-logo text-bolt-elements-textPrimary">
        <button
          onClick={toggleMenu}
          className="i-ph:sidebar-simple-duotone text-xl cursor-pointer hover:text-prometheus-yellow transition-colors p-1 rounded"
          aria-label="Toggle menu"
        />
        <a
          href="/"
          className="text-2xl font-black text-bolt-elements-textPrimary flex items-center gap-2"
          style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStretch: 'condensed' }}
        >
          <div className="i-ph:lightning-fill text-3xl text-prometheus-yellow" />
          <span>Bolt</span>
        </a>
      </div>
      {chat.started && ( // Display ChatDescription and HeaderActionButtons only when the chat has started.
        <>
          <span className="flex-1 px-4 truncate text-center text-bolt-elements-textPrimary">
            <ClientOnly>{() => <ChatDescription />}</ClientOnly>
          </span>
          <ClientOnly>
            {() => (
              <div className="">
                <HeaderActionButtons chatStarted={chat.started} />
              </div>
            )}
          </ClientOnly>
        </>
      )}
    </header>
  );
}
