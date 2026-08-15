import{U as v,w as o,j as l,S as p}from"./iframe-BWqC60Cj.js";import{s as S}from"./_storyI18n-DUPbxmag.js";import{M as k}from"./_MantineStoryShell-v1yXHo2n.js";import{S as u}from"./Stack-DqzY2ynC.js";import{T as _}from"./Text-ZiglToyN.js";import{S as g}from"./SegmentedControl-mn_7vsN3.js";import"./preload-helper-Dp1pzeXC.js";import"./get-env-uyVen0u2.js";import"./use-uncontrolled-CxrsbXe8.js";const c=["xs","sm","md","lg","xl"];function y(a,e){if(!e)return a.base;let t=c.indexOf(e);for(;t>=0;){if(c[t]in a)return a[c[t]];t-=1}return a.base}function w(a){return a.findLastIndex(e=>e)}function M(a,e){const t=v(),r=o(`(min-width: ${t.breakpoints.xs})`,!1,e),d=o(`(min-width: ${t.breakpoints.sm})`,!1,e),s=o(`(min-width: ${t.breakpoints.md})`,!1,e),i=o(`(min-width: ${t.breakpoints.lg})`,!1,e),m=o(`(min-width: ${t.breakpoints.xl})`,!1,e),x=w([r,d,s,i,m]);return y(a,c[x])}var b,h,f;const $={title:"Mantine/Primitives/SegmentedControl",parameters:{skipCanvas:!0,layout:"fullscreen"}},n={render:(a,e)=>{var t,r;const d=(r=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en",s=m=>S(d,m),i=M({base:"100%",sm:"auto"});return l.jsx(k,{children:l.jsxs(u,{gap:"xl",children:[l.jsxs(u,{gap:"xs",children:[l.jsx(_,{size:"xs",c:"gray.5",fw:500,children:"role filter / long-label stress"}),l.jsx(p,{type:"auto",scrollbars:"x",scrollbarSize:0,children:l.jsx(g,{style:{minWidth:i},defaultValue:"all",data:[{label:s("storybook.mantine.seg_demo_role_all"),value:"all"},{label:s("storybook.mantine.seg_demo_role_admin"),value:"admin"},{label:s("storybook.mantine.seg_demo_role_blocked"),value:"blocked"}]})})]}),l.jsxs(u,{gap:"xs",children:[l.jsx(_,{size:"xs",c:"gray.5",fw:500,children:"status filter / short labels"}),l.jsx(p,{type:"auto",scrollbars:"x",scrollbarSize:0,children:l.jsx(g,{style:{minWidth:i},defaultValue:"active",data:[{label:s("storybook.mantine.seg_demo_status_active"),value:"active"},{label:s("storybook.mantine.seg_demo_status_pending"),value:"pending"},{label:s("storybook.mantine.seg_demo_status_sold"),value:"sold"}]})})]})]})})}};n.parameters={...n.parameters,docs:{...(b=n.parameters)===null||b===void 0?void 0:b.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, key);

    // Mobile adaptive pattern (owner decision 2026-06-25):
    //   <640 → minWidth:'100%' — control stretches to full screen width when labels fit
    //          (Mantine control items have flex:1 and distribute the width equally).
    //          When labels overflow the viewport, ScrollArea provides swipe-scroll instead.
    //   ≥640 → minWidth:'auto' — content-width compact, NOT stretched (§6c desktop rule).
    // SSR caveat: useMatches returns base='100%' on first render (pre-hydration);
    //   on desktop this causes a brief full-width→auto reflow after hydration.
    //   Acceptable for stories; production consumers share the same SSR behaviour.
    const mobileMinWidth = useMatches({
      base: '100%',
      sm: 'auto'
    });
    return <MantineStoryShell>\r
        <Stack gap="xl">\r
          {/* Section 1: Role filter — long uk labels ("Адміністратор"/"Заблокований").\r
              At <640 with labels fitting: stretches to full width.\r
              At <640 with labels overflowing (e.g. uk@320): swipe-scroll via ScrollArea. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              role filter / long-label stress\r
            </Text>\r
            <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>\r
              <SegmentedControl style={{
              minWidth: mobileMinWidth
            }} defaultValue="all" data={[{
              label: t('storybook.mantine.seg_demo_role_all'),
              value: 'all'
            }, {
              label: t('storybook.mantine.seg_demo_role_admin'),
              value: 'admin'
            }, {
              label: t('storybook.mantine.seg_demo_role_blocked'),
              value: 'blocked'
            }]} />\r
            </ScrollArea>\r
          </Stack>\r
\r
          {/* Section 2: Status filter — short labels.\r
              At <640: labels fit → control stretches to full screen width.\r
              At ≥640: content-width compact, NOT stretched. */}\r
          <Stack gap="xs">\r
            <Text size="xs" c="gray.5" fw={500}>\r
              status filter / short labels\r
            </Text>\r
            <ScrollArea type="auto" scrollbars="x" scrollbarSize={0}>\r
              <SegmentedControl style={{
              minWidth: mobileMinWidth
            }} defaultValue="active" data={[{
              label: t('storybook.mantine.seg_demo_status_active'),
              value: 'active'
            }, {
              label: t('storybook.mantine.seg_demo_status_pending'),
              value: 'pending'
            }, {
              label: t('storybook.mantine.seg_demo_status_sold'),
              value: 'sold'
            }]} />\r
            </ScrollArea>\r
          </Stack>\r
        </Stack>\r
      </MantineStoryShell>;
  }
}`,...(f=n.parameters)===null||f===void 0||(h=f.docs)===null||h===void 0?void 0:h.source}}};const B=["Default"];export{n as Default,B as __namedExportsOrder,$ as default};
