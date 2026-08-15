import{j as r,S as p,G as g,h as y}from"./iframe-BWqC60Cj.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import{M as u}from"./_MantineStoryShell-v1yXHo2n.js";import{S as s}from"./Stack-DqzY2ynC.js";import{T as a}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";var x,h,m;const A={title:"Mantine/Primitives/ScrollArea",parameters:{skipCanvas:!0,layout:"fullscreen"}},f=10,w=8,l={render:(S,o)=>{var n,i;const d=(i=o==null||(n=o.globals)===null||n===void 0?void 0:n.locale)!==null&&i!==void 0?i:"en",e=c=>_(d,`storybook.mantine.${c}`);return r.jsx(u,{children:r.jsxs(s,{gap:"xl",children:[r.jsxs(s,{gap:"xs",children:[r.jsx(a,{size:"xs",c:"gray.5",fw:500,children:e("scrollarea_vertical_caption")}),r.jsx(p,{h:180,w:"100%",type:"always",scrollbars:"y",children:r.jsx(s,{gap:"sm",p:"sm",children:Array.from({length:f},(c,t)=>r.jsxs(a,{size:"sm",c:"gray.7",children:[e("scrollarea_vertical_item")," ",t+1]},t))})})]}),r.jsxs(s,{gap:"xs",children:[r.jsx(a,{size:"xs",c:"gray.5",fw:500,children:e("scrollarea_horizontal_caption")}),r.jsx(p,{w:"100%",type:"always",scrollbars:"x",children:r.jsx(g,{gap:"sm",wrap:"nowrap",p:"sm",children:Array.from({length:w},(c,t)=>r.jsx(y,{miw:140,h:80,bg:"gray.1",bd:"1px solid var(--mantine-color-gray-2)",bdrs:"lg",style:{display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0},children:r.jsxs(a,{size:"sm",c:"gray.7",children:[e("scrollarea_horizontal_item")," ",t+1]})},t))})})]}),r.jsxs(s,{gap:"xs",children:[r.jsx(a,{size:"xs",c:"gray.5",fw:500,children:e("scrollarea_empty_caption")}),r.jsx(p,{h:80,w:"100%",type:"always",scrollbars:"y",children:r.jsx(y,{p:"sm",children:r.jsx(a,{size:"sm",c:"gray.7",children:e("scrollarea_empty_content")})})})]})]})})}};l.parameters={...l.parameters,docs:{...(x=l.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`storybook.mantine.\${key}\`);
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — vertical: §6p 6px gray-200 pill thumb, fixed h=180 box, content taller than the box —\r
              scrollbars="y" keeps this demo single-axis; type="always" forces the thumb to paint for\r
              the static rendered-gate screenshot (no hover simulation in headless capture). */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_vertical_caption')}</Text>\r
            <ScrollArea h={180} w="100%" type="always" scrollbars="y">\r
              <Stack gap="sm" p="sm">\r
                {Array.from({
                length: VERTICAL_ITEM_COUNT
              }, (_, i) => <Text key={i} size="sm" c="gray.7">{t('scrollarea_vertical_item')} {i + 1}</Text>)}\r
              </Stack>\r
            </ScrollArea>\r
          </Stack>\r
\r
          {/* 2 — horizontal: root is w="100%" (constrained to the story column, never intrinsic-width)\r
              so the row of fixed-width chips — wider than any viewport down to 320px — scrolls INSIDE\r
              the ScrollArea viewport only. This is the gate-safety nuance (mobile <640 full-width gate):\r
              the internal overflow must never leak into document-level horizontal scroll. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_horizontal_caption')}</Text>\r
            <ScrollArea w="100%" type="always" scrollbars="x">\r
              <Group gap="sm" wrap="nowrap" p="sm">\r
                {Array.from({
                length: HORIZONTAL_ITEM_COUNT
              }, (_, i) => <Box key={i} miw={140} h={80} bg="gray.1" bd="1px solid var(--mantine-color-gray-2)" bdrs="lg" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>\r
                    <Text size="sm" c="gray.7">{t('scrollarea_horizontal_item')} {i + 1}</Text>\r
                  </Box>)}\r
              </Group>\r
            </ScrollArea>\r
          </Stack>\r
\r
          {/* 3 — negative: content shorter than the box — Mantine only paints a scrollbar/thumb when\r
              scrollHeight/scrollWidth exceeds the client box, so no phantom thumb renders here. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>{t('scrollarea_empty_caption')}</Text>\r
            <ScrollArea h={80} w="100%" type="always" scrollbars="y">\r
              <Box p="sm">\r
                <Text size="sm" c="gray.7">{t('scrollarea_empty_content')}</Text>\r
              </Box>\r
            </ScrollArea>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=l.parameters)===null||m===void 0||(h=m.docs)===null||h===void 0?void 0:h.source}}};const I=["Default"];export{l as Default,I as __namedExportsOrder,A as default};
