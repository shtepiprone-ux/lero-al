import{j as e,S as p}from"./iframe-BWqC60Cj.js";import{s as _}from"./_storyI18n-DUPbxmag.js";import{M as x}from"./_MantineStoryShell-v1yXHo2n.js";import{S as b}from"./Stack-DqzY2ynC.js";import{T as t}from"./Text-ZiglToyN.js";import{T as a}from"./Tabs-E09WO5bV.js";import"./preload-helper-Dp1pzeXC.js";import"./get-auto-contrast-value-Da6zqqWm.js";import"./create-scoped-keydown-handler-O-eo68DQ.js";import"./use-uncontrolled-CxrsbXe8.js";var n,c,m;const P={title:"Mantine/Primitives/Tabs",parameters:{skipCanvas:!0,layout:"fullscreen"}},s={render:(u,o)=>{var l,i;const d=(i=o==null||(l=o.globals)===null||l===void 0?void 0:l.locale)!==null&&i!==void 0?i:"en",r=v=>_(d,v);return e.jsx(x,{width:"constrained",children:e.jsx(b,{gap:"xl",children:e.jsxs(b,{gap:"xs",children:[e.jsx(t,{size:"xs",c:"gray.5",fw:500,children:"horizontal / swipe on overflow"}),e.jsxs(a,{defaultValue:"overview",children:[e.jsx(p,{type:"auto",scrollbars:"x",scrollbarSize:0,children:e.jsxs(a.List,{children:[e.jsx(a.Tab,{value:"overview",children:r("storybook.mantine.tabs_demo_tab_overview")}),e.jsx(a.Tab,{value:"details",children:r("storybook.mantine.tabs_demo_tab_details")}),e.jsx(a.Tab,{value:"activity",children:r("storybook.mantine.tabs_demo_tab_activity")})]})}),e.jsx(a.Panel,{value:"overview",pt:"sm",children:e.jsx(t,{size:"sm",c:"gray.7",children:r("storybook.mantine.tabs_demo_panel_text")})}),e.jsx(a.Panel,{value:"details",pt:"sm",children:e.jsx(t,{size:"sm",c:"gray.7",children:r("storybook.mantine.tabs_demo_panel_text")})}),e.jsx(a.Panel,{value:"activity",pt:"sm",children:e.jsx(t,{size:"sm",c:"gray.7",children:r("storybook.mantine.tabs_demo_panel_text")})})]})]})})})}};s.parameters={...s.parameters,docs:{...(n=s.parameters)===null||n===void 0?void 0:n.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, key);
    return <MantineStoryShell width="constrained">\r
        <Stack gap="xl">\r
          {/* Tabs always in a single horizontal row — no wrap (owner P0).\r
              theme.components.Tabs.styles.list.flexWrap='nowrap' prevents multi-line.\r
              ScrollArea scrollbarSize={0}: custom Mantine scrollbar rendered at 0px —\r
              no visible scrollbar track in any browser; touch/swipe still works.\r
              variant='pills' + segmented/pill chrome come from theme.ts defaultProps +\r
              input-chrome.css (Task 541) — no per-story color/variant override. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              horizontal / swipe on overflow\r
            </Text>\r
            <Tabs defaultValue="overview">\r
              <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>\r
                <Tabs.List>\r
                  <Tabs.Tab value="overview">\r
                    {t('storybook.mantine.tabs_demo_tab_overview')}\r
                  </Tabs.Tab>\r
                  <Tabs.Tab value="details">\r
                    {t('storybook.mantine.tabs_demo_tab_details')}\r
                  </Tabs.Tab>\r
                  <Tabs.Tab value="activity">\r
                    {t('storybook.mantine.tabs_demo_tab_activity')}\r
                  </Tabs.Tab>\r
                </Tabs.List>\r
              </ScrollArea>\r
\r
              <Tabs.Panel value="overview" pt="sm">\r
                <Text size="sm" c="gray.7">\r
                  {t('storybook.mantine.tabs_demo_panel_text')}\r
                </Text>\r
              </Tabs.Panel>\r
              <Tabs.Panel value="details" pt="sm">\r
                <Text size="sm" c="gray.7">\r
                  {t('storybook.mantine.tabs_demo_panel_text')}\r
                </Text>\r
              </Tabs.Panel>\r
              <Tabs.Panel value="activity" pt="sm">\r
                <Text size="sm" c="gray.7">\r
                  {t('storybook.mantine.tabs_demo_panel_text')}\r
                </Text>\r
              </Tabs.Panel>\r
            </Tabs>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(m=s.parameters)===null||m===void 0||(c=m.docs)===null||c===void 0?void 0:c.source}}};const M=["Default"];export{s as Default,M as __namedExportsOrder,P as default};
