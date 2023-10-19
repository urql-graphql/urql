import * as React from 'react';
import { ServerInsertedHTMLContext } from 'next/navigation';
import type { UrqlResult } from './useUrqlValue';

interface DataHydrationValue {
  isInjecting: boolean;
  operationValuesByKey: Record<number, UrqlResult>;
  RehydrateScript: () =>
    | React.DetailedReactHTMLElement<
        { dangerouslySetInnerHTML: { __html: string } },
        HTMLElement
      >
    | React.FunctionComponentElement<any>;
}

const DataHydrationContext = React.createContext<
  DataHydrationValue | undefined
>(undefined);

function transportDataToJS(data: any) {
  const key = 'urql_transport';
  return `(window[Symbol.for("${key}")] ??= []).push(${JSON.stringify(data)})`;
}

export const DataHydrationContextProvider = ({
  nonce,
  children,
}: React.PropsWithChildren<{ nonce?: string }>) => {
  const dataHydrationContext = React.useRef<DataHydrationValue>();
  if (typeof window == 'undefined') {
    if (!dataHydrationContext.current)
      dataHydrationContext.current = buildContext({ nonce });
  }

  return React.createElement(
    DataHydrationContext.Provider,
    { value: dataHydrationContext.current },
    children
  );
};

export function useDataHydrationContext(): DataHydrationValue | undefined {
  const dataHydrationContext = React.useContext(DataHydrationContext);
  const insertHtml = React.useContext(ServerInsertedHTMLContext);

  if (typeof window !== 'undefined') return;

  if (insertHtml && dataHydrationContext && !dataHydrationContext.isInjecting) {
    dataHydrationContext.isInjecting = true;
    insertHtml(() =>
      React.createElement(dataHydrationContext.RehydrateScript, {})
    );
  }
  return dataHydrationContext;
}

let key = 0;
function buildContext({ nonce }: { nonce?: string }): DataHydrationValue {
  const dataHydrationContext: DataHydrationValue = {
    isInjecting: false,
    operationValuesByKey: {},
    RehydrateScript() {
      dataHydrationContext.isInjecting = false;
      if (!Object.keys(dataHydrationContext.operationValuesByKey).length)
        return React.createElement(React.Fragment);

      const __html = transportDataToJS({
        rehydrate: { ...dataHydrationContext.operationValuesByKey },
      });

      dataHydrationContext.operationValuesByKey = {};

      return React.createElement('script', {
        key: key++,
        nonce: nonce,
        dangerouslySetInnerHTML: { __html },
      });
    },
  };

  return dataHydrationContext;
}
