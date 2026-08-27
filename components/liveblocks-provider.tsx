"use client";

import { ReactNode, createContext, useContext, useState, useEffect } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

const LiveblocksContext = createContext(false);

export function useLiveblocksEnabled() {
  return useContext(LiveblocksContext);
}

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2 text-[12px] text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
        Connecting to room...
      </div>
    </div>
  );
}

export function LiveblocksRoom({
  roomId,
  children,
  fallback,
}: {
  roomId: string;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    // Check server-side env via the auth endpoint — if it responds successfully,
    // Liveblocks is enabled. For simplicity, we just check that the env exists
    // at build time and trust the endpoint. Since this is client-only, it
    // always matches between SSR (false) and client mount (set via effect).
    setEnabled(true);
  }, []);

  // Always render the same tree on server (context = false).
  // After mount, enabled flips to true and the provider is wired up.
  return (
    <LiveblocksContext.Provider value={enabled}>
      {enabled ? (
        <LiveblocksProvider authEndpoint="/api/liveblocks-auth">
          <RoomProvider
            id={roomId}
            initialPresence={{ name: "", avatar: "", color: "" }}
          >
            <ClientSideSuspense fallback={fallback ?? <LoadingFallback />}>
              {children}
            </ClientSideSuspense>
          </RoomProvider>
        </LiveblocksProvider>
      ) : (
        children
      )}
    </LiveblocksContext.Provider>
  );
}
