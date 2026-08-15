import{j as e,G as c,h as n}from"./iframe-BWqC60Cj.js";import{M as h}from"./_MantineStoryShell-v1yXHo2n.js";import{S as t}from"./Stack-DqzY2ynC.js";import{T as a}from"./Text-ZiglToyN.js";import{S as r}from"./Skeleton-q4Bsqgtd.js";import"./preload-helper-Dp1pzeXC.js";var i,l,o;const w={title:"Mantine/Primitives/Skeleton",parameters:{skipCanvas:!0,layout:"fullscreen"}},s={render:()=>e.jsx(h,{children:e.jsxs(t,{gap:"xl",children:[e.jsxs(t,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"text lines — §6n-LIVE gray-50 pulse + gray-200 border, 12px radius, full-width at <640"}),e.jsxs(t,{gap:"sm",children:[e.jsx(r,{height:12,width:"100%"}),e.jsx(r,{height:12,width:"100%"}),e.jsx(r,{height:12,width:"60%"})]})]}),e.jsxs(t,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"block — a media/card placeholder, full-width at <640"}),e.jsx(r,{height:160,width:"100%"})]}),e.jsxs(t,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"circle — avatar placeholder, intrinsic size (not stretched full-width)"}),e.jsx(r,{height:48,circle:!0})]}),e.jsxs(t,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"composite — card row: circle avatar + two text lines"}),e.jsxs(c,{gap:"sm",wrap:"nowrap",align:"flex-start",children:[e.jsx(r,{height:40,circle:!0}),e.jsxs(t,{gap:6,style:{flex:1,minWidth:0},children:[e.jsx(r,{height:12,width:"50%"}),e.jsx(r,{height:10,width:"80%"})]})]})]}),e.jsxs(t,{gap:"xs",children:[e.jsx(a,{size:"xs",c:"gray.5",fw:500,children:"visible=false — passthrough: real content renders, no placeholder overlay"}),e.jsx(r,{visible:!1,children:e.jsx(n,{p:"sm",style:{border:"1px solid var(--mantine-color-gray-3)",borderRadius:"var(--mantine-radius-lg)"},children:e.jsx(a,{size:"sm",c:"gray.8",children:"real content — not a placeholder"})})})]})]})})};s.parameters={...s.parameters,docs:{...(i=s.parameters)===null||i===void 0?void 0:i.docs,source:{originalSource:`{
  render: () => {
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
\r
          {/* 1 — text-line skeleton: §6n-LIVE gray-50 fill + gray-200 border, 12px radius, decreasing widths (paragraph shape) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              text lines — §6n-LIVE gray-50 pulse + gray-200 border, 12px radius, full-width at &lt;640\r
            </Text>\r
            <Stack gap="sm">\r
              <Skeleton height={12} width="100%" />\r
              <Skeleton height={12} width="100%" />\r
              <Skeleton height={12} width="60%" />\r
            </Stack>\r
          </Stack>\r
\r
          {/* 2 — block/card skeleton: a large rectangular placeholder (e.g. an image/media slot) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              block — a media/card placeholder, full-width at &lt;640\r
            </Text>\r
            <Skeleton height={160} width="100%" />\r
          </Stack>\r
\r
          {/* 3 — circle skeleton: avatar placeholder, intrinsic size, not full-width */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              circle — avatar placeholder, intrinsic size (not stretched full-width)\r
            </Text>\r
            <Skeleton height={48} circle />\r
          </Stack>\r
\r
          {/* 4 — composite: a realistic card row (circle avatar + two text lines), the common\r
              "loading list item" shape */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              composite — card row: circle avatar + two text lines\r
            </Text>\r
            <Group gap="sm" wrap="nowrap" align="flex-start">\r
              <Skeleton height={40} circle />\r
              <Stack gap={6} style={{
              flex: 1,
              minWidth: 0
            }}>\r
                <Skeleton height={12} width="50%" />\r
                <Skeleton height={10} width="80%" />\r
              </Stack>\r
            </Group>\r
          </Stack>\r
\r
          {/* 5 — negative: visible={false} passthrough — renders the real children, not the\r
              placeholder (Mantine's own prop, verifying it still works through our chrome override) */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              visible=false — passthrough: real content renders, no placeholder overlay\r
            </Text>\r
            <Skeleton visible={false}>\r
              <Box p="sm" style={{
              border: '1px solid var(--mantine-color-gray-3)',
              borderRadius: 'var(--mantine-radius-lg)'
            }}>\r
                <Text size="sm" c="gray.8">real content — not a placeholder</Text>\r
              </Box>\r
            </Skeleton>\r
          </Stack>\r
\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(o=s.parameters)===null||o===void 0||(l=o.docs)===null||l===void 0?void 0:l.source}}};const f=["Default"];export{s as Default,f as __namedExportsOrder,w as default};
