import{j as t}from"./iframe-BWqC60Cj.js";import{S as a,P as d}from"./Section-BYOSBbVU.js";import{s as $}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";var S,h,x,w,f,k,y,j,P,R,T,B,O,D,I,N,E,L,A,F,H,W,q,U;const s=(n,e="en")=>$(e,`storybook.section.${n}`);function i(n){return t.jsx("div",{className:"rounded-xl border bg-muted/30 p-6 text-sm text-muted-foreground text-center",children:s("sample",n)})}const M={title:"Layout/Section",component:a,tags:["autodocs"],parameters:{docs:{description:{component:"Tier-2 global layout primitive. Server-safe titled content block that sits inside a PageShell. Renders no container of its own. Optional title (h2) + description (p) with heading→body rhythm. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/design-system.md §5/§6/§7 (Task 345 DS-1)."}}}},c={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsx(a,{title:s("avail",r),description:s("browse",r),children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},p={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsx(a,{title:s("avail",r),children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},v={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsx(a,{description:s("browse",r),children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},_={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsx(a,{children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},u={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsxs("div",{className:"space-y-8",children:[t.jsx(a,{title:s("first",r),description:s("consumer",r),children:i(r)}),t.jsx(a,{title:s("second",r),children:i(r)}),t.jsx(a,{children:i(r)})]})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},m={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{container:"narrow",children:t.jsx(a,{title:s("narrow",r),description:s("narrow_d",r),children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},g={render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{container:"form",children:t.jsx(a,{title:s("form",r),description:s("form_d",r),children:i(r)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},b={parameters:{docs:{description:{story:"@320: long title + description wrap without overflow. Use locale toolbar for sq/en/uk/it."}}},render:(n,e)=>{var o,l;const r=(l=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&l!==void 0?l:"en";return t.jsx(d,{children:t.jsx(a,{title:s("long_t",r),description:s("long_d",r),children:i(r)})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};c.parameters={...c.parameters,docs:{...(S=c.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section title={st('avail', l)} description={st('browse', l)}>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(x=c.parameters)===null||x===void 0||(h=x.docs)===null||h===void 0?void 0:h.source}}};p.parameters={...p.parameters,docs:{...(w=p.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section title={st('avail', l)}>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(k=p.parameters)===null||k===void 0||(f=k.docs)===null||f===void 0?void 0:f.source}}};v.parameters={...v.parameters,docs:{...(y=v.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section description={st('browse', l)}>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(P=v.parameters)===null||P===void 0||(j=P.docs)===null||j===void 0?void 0:j.source}}};_.parameters={..._.parameters,docs:{...(R=_.parameters)===null||R===void 0?void 0:R.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(B=_.parameters)===null||B===void 0||(T=B.docs)===null||T===void 0?void 0:T.source}}};u.parameters={...u.parameters,docs:{...(O=u.parameters)===null||O===void 0?void 0:O.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <div className="space-y-8">\r
        <Section title={st('first', l)} description={st('consumer', l)}>{sampleBlock(l)}</Section>\r
        <Section title={st('second', l)}>{sampleBlock(l)}</Section>\r
        <Section>{sampleBlock(l)}</Section>\r
      </div>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(I=u.parameters)===null||I===void 0||(D=I.docs)===null||D===void 0?void 0:D.source}}};m.parameters={...m.parameters,docs:{...(N=m.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell container="narrow">\r
      <Section title={st('narrow', l)} description={st('narrow_d', l)}>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(L=m.parameters)===null||L===void 0||(E=L.docs)===null||E===void 0?void 0:E.source}}};g.parameters={...g.parameters,docs:{...(A=g.parameters)===null||A===void 0?void 0:A.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell container="form">\r
      <Section title={st('form', l)} description={st('form_d', l)}>{sampleBlock(l)}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(H=g.parameters)===null||H===void 0||(F=H.docs)===null||F===void 0?void 0:F.source}}};b.parameters={...b.parameters,docs:{...(W=b.parameters)===null||W===void 0?void 0:W.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: long title + description wrap without overflow. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section title={st('long_t', l)} description={st('long_d', l)}>\r
        {sampleBlock(l)}\r
      </Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(U=b.parameters)===null||U===void 0||(q=U.docs)===null||q===void 0?void 0:q.source}}};const Q=["WithTitleAndDescription","TitleOnly","DescriptionOnly","EmptyHeading","Stacked","InsideNarrow","InsideForm","LocaleStress"];export{v as DescriptionOnly,_ as EmptyHeading,g as InsideForm,m as InsideNarrow,b as LocaleStress,u as Stacked,p as TitleOnly,c as WithTitleAndDescription,Q as __namedExportsOrder,M as default};
