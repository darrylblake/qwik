import { component$, Resource, useResource$ } from '@builder.io/qwik';
import { useLocation } from '@builder.io/qwik-city';
import { getBuilderSearchParams, getContent, RenderContent } from '@builder.io/sdk-qwik';

export default component$<{ html?: any; apiKey: string; model: string; tag: 'main' | 'div' }>(
  (props) => {
    const location = useLocation();
    const isSDK = location.query.get('render') === 'sdk';
    const builderContentRsrc = useResource$<any>(() => {
      if (isSDK) {
        return getContent({
          model: props.model!,
          apiKey: props.apiKey!,
          options: getBuilderSearchParams(location.query),
          userAttributes: {
            urlPath: location.pathname,
          },
        });
      } else if (props.html) {
        return null;
      } else {
        return getBuilderContent(props.apiKey, props.model, location.pathname);
      }
    });

    if (props.html && !isSDK) {
      return <props.tag class="builder" dangerouslySetInnerHTML={props.html} />;
    }
    return (
      <Resource
        value={builderContentRsrc}
        onPending={() => <div>Loading...</div>}
        onResolved={(content) => (
          <RenderContent model={props.model} content={content} apiKey={props.apiKey} />
        )}
      />
    );
  }
);

export interface BuilderContent {
  html: string;
}

export async function getBuilderContent(
  apiKey: string,
  model: string,
  urlPath: string
): Promise<BuilderContent> {
  const qwikUrl = new URL('https://cdn.builder.io/api/v1/qwik/' + model);
  qwikUrl.searchParams.set('apiKey', apiKey);
  qwikUrl.searchParams.set('userAttributes.urlPath', urlPath);

  const response = await fetch(qwikUrl.href);
  if (response.ok) {
    const content: BuilderContent = JSON.parse(await response.text());
    return content;
  }
  throw new Error('Unable to load Builder content');
}