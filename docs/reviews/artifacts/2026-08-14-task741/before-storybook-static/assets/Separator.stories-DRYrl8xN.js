import{j as r,G as g}from"./iframe-BWqC60Cj.js";import{s as x}from"./_storyI18n-DUPbxmag.js";import{M as u}from"./_MantineStoryShell-v1yXHo2n.js";import{S as n}from"./Stack-DqzY2ynC.js";import{T as t}from"./Text-ZiglToyN.js";import{D as l}from"./Divider-DJCK80GL.js";import"./preload-helper-Dp1pzeXC.js";var c,d,m;const z={title:"Mantine/Primitives/Separator",parameters:{skipCanvas:!0,layout:"fullscreen"}},a={render:(v,s)=>{var o,i;const p=(i=s==null||(o=s.globals)===null||o===void 0?void 0:o.locale)!==null&&i!==void 0?i:"en",e=_=>x(p,`storybook.mantine.${_}`);return r.jsx(u,{children:r.jsxs(n,{gap:"xl",children:[r.jsxs(n,{gap:"sm",children:[r.jsx(t,{size:"sm",c:"gray.8",children:e("separator_content_intro")}),r.jsx(l,{}),r.jsx(t,{size:"sm",c:"gray.7",children:e("separator_content_details")})]}),r.jsxs(g,{gap:"sm",children:[r.jsx(t,{size:"sm",c:"gray.7",children:e("separator_item_left")}),r.jsx(l,{orientation:"vertical"}),r.jsx(t,{size:"sm",c:"gray.7",children:e("separator_item_right")})]}),r.jsxs(n,{gap:"sm",children:[r.jsx(t,{size:"sm",c:"gray.8",style:{wordBreak:"break-word"},children:e("separator_content_long")}),r.jsx(l,{}),r.jsx(t,{size:"sm",c:"gray.7",children:e("separator_content_details")})]})]})})}};a.parameters={...a.parameters,docs:{...(c=a.parameters)===null||c===void 0?void 0:c.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — horizontal: §6o gray-200, 1px solid, full-width at <640 — two content blocks\r
              separated by a full-width horizontal Divider */}\r
          <Stack gap="sm">\r
            <Text size="sm" c="gray.8">{t('separator_content_intro')}</Text>\r
            <Divider />\r
            <Text size="sm" c="gray.7">{t('separator_content_details')}</Text>\r
          </Stack>\r
\r
          {/* 2 — vertical: same gray-200 token, intrinsic height (not stretched full-width) —\r
              two inline items separated by a vertical Divider */}\r
          <Group gap="sm">\r
            <Text size="sm" c="gray.7">{t('separator_item_left')}</Text>\r
            <Divider orientation="vertical" />\r
            <Text size="sm" c="gray.7">{t('separator_item_right')}</Text>\r
          </Group>\r
\r
          {/* 3 — negative: long uk/sq/it content wraps around the divider, never clips, no\r
              h-scroll at 320 */}\r
          <Stack gap="sm">\r
            <Text size="sm" c="gray.8" style={{
            wordBreak: 'break-word'
          }}>{t('separator_content_long')}</Text>\r
            <Divider />\r
            <Text size="sm" c="gray.7">{t('separator_content_details')}</Text>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=a.parameters)===null||m===void 0||(d=m.docs)===null||d===void 0?void 0:d.source}}};const D=["Default"];export{a as Default,D as __namedExportsOrder,z as default};
