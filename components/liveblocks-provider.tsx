"use client";

import { ReactNode, createContext, useContext } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";

const LB_KEY = process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY ?? "";
export const LIVEBLOCKS_ENABLED = LB_KEY.startsWith("pk_") && LB_KEY.length > 10;

const LiveblocksContext = createContext(LIVEBLOCKS_ENABLED);

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
  if (!LIVEBLOCKS_ENABLED) {
    return (
      <LiveblocksContext.Provider value={false}>
        {children}
      </LiveblocksContext.Provider>
    );
  }

  return (
    <LiveblocksContext.Provider value={true}>
      <LiveblocksProvider publicApiKey={LB_KEY}>
        <RoomProvider
          id={roomId}
          initialPresence={{ name: "", avatar: "", color: "" }}
        >
          <ClientSideSuspense fallback={fallback ?? <LoadingFallback />}>
            {children}
          </ClientSideSuspense>
        </RoomProvider>
      </LiveblocksProvider>
    </LiveblocksContext.Provider>
  );
}
