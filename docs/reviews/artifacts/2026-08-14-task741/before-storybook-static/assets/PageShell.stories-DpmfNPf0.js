import{j as l}from"./iframe-BWqC60Cj.js";import{P as n,S as i}from"./Section-BYOSBbVU.js";import{s as E}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";var g,b,h,x,S,f,w,j,N,P,k,L,y,R,A,C,M,D;const a=(t,e="en")=>E(e,`storybook.pageshell.${t}`),q={title:"Layout/PageShell",component:n,tags:["autodocs"],parameters:{docs:{description:{component:"Tier-2 global layout primitive. Server-safe outermost public/cabinet page content wrapper. Provides container-wide (≤1408px) with optional narrow (max-w-3xl) or form (max-w-xl) inner column. Breakpoints verified via the Storybook viewport toolbar; locales via the locale toolbar. See docs/design-system.md §4/§5/§7 (Task 345 DS-1)."}}}},d=l.jsxs("div",{className:"rounded-2xl border bg-card overflow-hidden",children:[l.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b",children:[l.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),l.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[l.jsx("div",{className:"h-3.5 bg-muted rounded-full w-2/3"}),l.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-1/2"})]}),l.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]}),l.jsxs("div",{className:"flex items-center gap-3 px-4 py-3",children:[l.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),l.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[l.jsx("div",{className:"h-3.5 bg-muted rounded-full w-3/4"}),l.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-2/5"})]}),l.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]})]}),c={render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{children:l.jsx(i,{title:a("listings",s),description:a("browse",s),children:d})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},v={render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{container:"narrow",children:l.jsx(i,{title:a("reading",s),description:a("reading_d",s),children:d})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},p={render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{container:"form",children:l.jsx(i,{title:a("form",s),description:a("form_d",s),children:d})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},u={render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{as:"div",children:l.jsx(i,{title:a("avail",s),children:d})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},m={render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{className:"py-4",children:l.jsx(i,{title:a("search_r",s),children:d})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},_={parameters:{docs:{description:{story:"@320: long title wraps without overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for all widths."}}},render:(t,e)=>{var o,r;const s=(r=e==null||(o=e.globals)===null||o===void 0?void 0:o.locale)!==null&&r!==void 0?r:"en";return l.jsx(n,{children:l.jsx(i,{title:a("long_t",s),description:a("long_d",s),children:d})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};c.parameters={...c.parameters,docs:{...(g=c.parameters)===null||g===void 0?void 0:g.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section title={ps('listings', l)} description={ps('browse', l)}>{SAMPLE_BLOCK}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(h=c.parameters)===null||h===void 0||(b=h.docs)===null||b===void 0?void 0:b.source}}};v.parameters={...v.parameters,docs:{...(x=v.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell container="narrow">\r
      <Section title={ps('reading', l)} description={ps('reading_d', l)}>{SAMPLE_BLOCK}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(f=v.parameters)===null||f===void 0||(S=f.docs)===null||S===void 0?void 0:S.source}}};p.parameters={...p.parameters,docs:{...(w=p.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell container="form">\r
      <Section title={ps('form', l)} description={ps('form_d', l)}>{SAMPLE_BLOCK}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(N=p.parameters)===null||N===void 0||(j=N.docs)===null||j===void 0?void 0:j.source}}};u.parameters={...u.parameters,docs:{...(P=u.parameters)===null||P===void 0?void 0:P.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell as="div">\r
      <Section title={ps('avail', l)}>{SAMPLE_BLOCK}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(L=u.parameters)===null||L===void 0||(k=L.docs)===null||k===void 0?void 0:k.source}}};m.parameters={...m.parameters,docs:{...(y=m.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell className="py-4">\r
      <Section title={ps('search_r', l)}>{SAMPLE_BLOCK}</Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(A=m.parameters)===null||A===void 0||(R=A.docs)===null||R===void 0?void 0:R.source}}};_.parameters={..._.parameters,docs:{...(C=_.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: '@320: long title wraps without overflow. Use locale toolbar for sq/en/uk/it; viewport toolbar for all widths.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <PageShell>\r
      <Section title={ps('long_t', l)} description={ps('long_d', l)}>\r
        {SAMPLE_BLOCK}\r
      </Section>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(D=_.parameters)===null||D===void 0||(M=D.docs)===null||M===void 0?void 0:M.source}}};const U=["Default","Narrow","Form","AsDiv","ClassNameMerge","LocaleStress"];export{u as AsDiv,m as ClassNameMerge,c as Default,p as Form,_ as LocaleStress,v as Narrow,U as __namedExportsOrder,q as default};
