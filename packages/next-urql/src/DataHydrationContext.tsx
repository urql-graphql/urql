import React from 'react';
import { ServerInsertedHTMLContext } from 'next/navigation';

interface DataHydrationValue {
  isInjecting: boolean;
  operationValuesByKey: Record<number, { data: any; error: any }>;
  RehydrateScript: () => JSX.Element;
}

const DataHydrationContext = React.createContext<
  DataHydrationValue | undefined
>(undefined);

function transportDataToJS(data: any) {
  const key = 'urql_transport';
  return `(window[Symbol.for("${key}")] ??= []).push(${JSON.stringify(data)})`;
}

export const DataHydrationContextProvider = ({
  children,
}: React.PropsWithChildren<{}>) => {
  const dataHydrationContext = React.useRef<DataHydrationValue>();
  if (typeof window == 'undefined') {
    if (!dataHydrationContext.current)
      dataHydrationContext.current = buildContext();
  }

  return (
    <DataHydrationContext.Provider value={dataHydrationContext.current}>
      {children}
    </DataHydrationContext.Provider>
  );
};

export function useDataHydrationContext(): DataHydrationValue | undefined {
  const dataHydrationContext = React.useContext(DataHydrationContext);
  const insertHtml = React.useContext(ServerInsertedHTMLContext);

  if (typeof window !== 'undefined') return;

  if (insertHtml && dataHydrationContext && !dataHydrationContext.isInjecting) {
    dataHydrationContext.isInjecting = true;
    insertHtml(() => <dataHydrationContext.RehydrateScript />);
  }
  return dataHydrationContext;
}

function buildContext(): DataHydrationValue {
  const dataHydrationContext: DataHydrationValue = {
    isInjecting: false,
    operationValuesByKey: {},
    RehydrateScript() {
      dataHydrationContext.isInjecting = false;
      if (!Object.keys(dataHydrationContext.operationValuesByKey).length)
        return <></>;

      const __html = transportDataToJS({
        rehydrate: { ...dataHydrationContext.operationValuesByKey },
      });

      dataHydrationContext.operationValuesByKey = {};

      return (
        <script
          key={Math.random()}
          dangerouslySetInnerHTML={{
            __html,
          }}
        />
      );
    },
  };

  return dataHydrationContext;
}
