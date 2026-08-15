import{j as e,r as G}from"./iframe-BWqC60Cj.js";import{B as d}from"./button-DqckHWPj.js";import{B as I}from"./badge-DkqjA9o-.js";import{c as M}from"./utils-D5ceN5oG.js";import{P as h,S as E}from"./Section-BYOSBbVU.js";import{s as D}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";function n({title:r,description:t,countBadge:s,action:o,as:l="header",className:i}){return e.jsxs(l,{"data-testid":"page-header",className:M("flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",i),children:[e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsxs("div",{className:"flex items-center gap-2 min-w-0 flex-wrap",children:[e.jsx("h1",{className:"text-2xl sm:text-3xl 2xl:text-4xl font-bold leading-tight min-w-0",children:r}),s!=null&&e.jsx("div",{className:"shrink-0",children:s})]}),t!=null&&e.jsx("p",{className:"text-sm sm:text-base text-muted-foreground mt-1",children:t})]}),o!=null&&e.jsx("div",{className:"shrink-0 max-sm:w-full [&>*]:max-sm:w-full",children:o})]})}n.__docgenInfo={description:"",methods:[],displayName:"PageHeader",props:{title:{required:!0,tsType:{name:"string"},description:""},description:{required:!1,tsType:{name:"string"},description:""},countBadge:{required:!1,tsType:{name:"ReactNode"},description:""},action:{required:!1,tsType:{name:"ReactNode"},description:""},as:{required:!1,tsType:{name:"union",raw:"'header' | 'div'",elements:[{name:"literal",value:"'header'"},{name:"literal",value:"'div'"}]},description:"",defaultValue:{value:"'header'",computed:!1}},className:{required:!1,tsType:{name:"string"},description:""}}};var x,b,f,w,j,k,y,N,S,C,B,T,A,P,R,W,O,z;const Y={new_lst:"new_listing",long_t:"long_title",long_d:"long_desc",browse_s:"browse_short"},a=(r,t="en")=>{var s;return D(t,`storybook.pageheader.${(s=Y[r])!==null&&s!==void 0?s:r}`)},re={title:"Layout/PageHeader",component:n,tags:["autodocs"],parameters:{docs:{description:{component:"Tier-2 global layout primitive. Server-safe page-level header block (title + optional description/countBadge/action). Sits INSIDE a PageShell; owns no container. Action stacks below <md:, right-aligns md:+. All action buttons are interactive — clicking shows in-canvas feedback. Breakpoints via viewport toolbar; locales via locale toolbar. See docs/design-system.md §9/§6/§7 (Task 347 DS-2)."}}}},L=e.jsxs("div",{className:"rounded-2xl border bg-card overflow-hidden",children:[e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3 border-b",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-2/3"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-1/2"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]}),e.jsxs("div",{className:"flex items-center gap-3 px-4 py-3",children:[e.jsx("div",{className:"h-9 w-9 rounded-full bg-muted shrink-0"}),e.jsxs("div",{className:"flex-1 space-y-1.5 min-w-0",children:[e.jsx("div",{className:"h-3.5 bg-muted rounded-full w-3/4"}),e.jsx("div",{className:"h-2.5 bg-muted/60 rounded-full w-2/5"})]}),e.jsx("div",{className:"h-5 w-14 rounded-full bg-muted shrink-0"})]})]}),_=r=>e.jsx(E,{title:a("listings",r),description:a("browse_s",r),children:L}),U=e.jsx(I,{variant:"secondary",children:"142"});function $(r,t="en"){return D(t,`storybook.pageheader.${r}`)}function F({label:r,locale:t="en"}){return r?e.jsxs("div",{className:"flex items-center gap-2 px-4 py-2 rounded-lg border bg-muted/40 text-sm",children:[e.jsx("span",{className:"h-1.5 w-1.5 rounded-full bg-primary shrink-0"}),e.jsxs("span",{className:"text-muted-foreground",children:[$("action",t),": "]}),e.jsx("strong",{children:r})]}):null}function H({action:r,title:t,description:s,countBadge:o,content:l,locale:i="en"}){const[q,K]=G.useState(null);return e.jsx(h,{children:e.jsxs("div",{className:"space-y-4",children:[e.jsx(n,{title:t,description:s,countBadge:o,action:r?r(K):void 0}),e.jsx(F,{label:q,locale:i}),l??_(i)]})})}const c={render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(h,{children:e.jsxs("div",{className:"space-y-6",children:[e.jsx(n,{title:a("avail",l),description:a("browse",l)}),_(l)]})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},p={render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(h,{children:e.jsxs("div",{className:"space-y-6",children:[e.jsx(n,{title:a("avail",l)}),_(l)]})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},u={render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(h,{children:e.jsxs("div",{className:"space-y-6",children:[e.jsx(n,{title:a("avail",l),description:a("browse",l),countBadge:U}),_(l)]})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},m={parameters:{docs:{description:{story:'Single action button in the action slot. size="xl" (44px). Click → in-canvas feedback. Action stacks below header at <md:, right-aligns at md:+.'}}},render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(H,{title:a("avail",l),description:a("browse",l),locale:l,action:i=>e.jsx(d,{size:"xl",onClick:()=>i(a("new_lst",l)),children:a("new_lst",l)})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},v={parameters:{docs:{description:{story:"Three-button action cluster in the action slot — plain flex-wrap div container. Click any button → feedback. At <md: buttons stack full-width."}}},render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(H,{title:a("avail",l),description:a("browse",l),countBadge:U,locale:l,action:i=>e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx(d,{size:"xl",variant:"outline",onClick:()=>i(a("export",l)),children:a("export",l)}),e.jsx(d,{size:"xl",variant:"outline",onClick:()=>i(a("edit",l)),children:a("edit",l)}),e.jsx(d,{size:"xl",onClick:()=>i(a("new_lst",l)),children:a("new_lst",l)})]})})},globals:{viewport:{value:"desktop1440",isRotated:!1}}},g={parameters:{docs:{description:{story:"uk@320: long Ukrainian title + description + action. Title must wrap. Action must be full-width (max-md:w-full). Use viewport toolbar for other widths; locale toolbar for other locales."}}},render:(r,t)=>{var s,o;const l=(o=t==null||(s=t.globals)===null||s===void 0?void 0:s.locale)!==null&&o!==void 0?o:"en";return e.jsx(H,{locale:l,title:a("long_t",l),description:a("long_d",l),action:i=>e.jsx(d,{size:"xl",onClick:()=>i(a("new_lst",l)),children:a("new_lst",l)}),content:e.jsx(E,{title:a("listings",l),description:a("browse_s",l),children:L})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};c.parameters={...c.parameters,docs:{...(x=c.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageShell>\r
      <div className="space-y-6">\r
        <PageHeader title={ph2("avail", l)} description={ph2("browse", l)} />\r
        {sampleContent(l)}\r
      </div>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(f=c.parameters)===null||f===void 0||(b=f.docs)===null||b===void 0?void 0:b.source}}};p.parameters={...p.parameters,docs:{...(w=p.parameters)===null||w===void 0?void 0:w.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageShell>\r
      <div className="space-y-6">\r
        <PageHeader title={ph2("avail", l)} />\r
        {sampleContent(l)}\r
      </div>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(k=p.parameters)===null||k===void 0||(j=k.docs)===null||j===void 0?void 0:j.source}}};u.parameters={...u.parameters,docs:{...(y=u.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageShell>\r
      <div className="space-y-6">\r
        <PageHeader title={ph2("avail", l)} description={ph2("browse", l)} countBadge={COUNT_BADGE} />\r
        {sampleContent(l)}\r
      </div>\r
    </PageShell>;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(S=u.parameters)===null||S===void 0||(N=S.docs)===null||N===void 0?void 0:N.source}}};m.parameters={...m.parameters,docs:{...(C=m.parameters)===null||C===void 0?void 0:C.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Single action button in the action slot. size="xl" (44px). Click → in-canvas feedback. Action stacks below header at <md:, right-aligns at md:+.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageHeaderStory title={ph2("avail", l)} description={ph2("browse", l)} locale={l} action={on => <Button size="xl" onClick={() => on(ph2("new_lst", l))}>{ph2("new_lst", l)}</Button>} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(T=m.parameters)===null||T===void 0||(B=T.docs)===null||B===void 0?void 0:B.source}}};v.parameters={...v.parameters,docs:{...(A=v.parameters)===null||A===void 0?void 0:A.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Three-button action cluster in the action slot — plain flex-wrap div container. Click any button → feedback. At <md: buttons stack full-width.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageHeaderStory title={ph2('avail', l)} description={ph2('browse', l)} countBadge={COUNT_BADGE} locale={l} action={on => <div className="flex flex-wrap gap-2">\r
          <Button size="xl" variant="outline" onClick={() => on(ph2('export', l))}>{ph2('export', l)}</Button>\r
          <Button size="xl" variant="outline" onClick={() => on(ph2('edit', l))}>{ph2('edit', l)}</Button>\r
          <Button size="xl" onClick={() => on(ph2('new_lst', l))}>{ph2('new_lst', l)}</Button>\r
        </div>} />;
  },
  globals: {
    viewport: {
      value: 'desktop1440',
      isRotated: false
    }
  }
}`,...(R=v.parameters)===null||R===void 0||(P=R.docs)===null||P===void 0?void 0:P.source}}};g.parameters={...g.parameters,docs:{...(W=g.parameters)===null||W===void 0?void 0:W.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'uk@320: long Ukrainian title + description + action. Title must wrap. Action must be full-width (max-md:w-full). Use viewport toolbar for other widths; locale toolbar for other locales.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? "en";
    return <PageHeaderStory locale={l} title={ph2("long_t", l)} description={ph2("long_d", l)} action={on => <Button size="xl" onClick={() => on(ph2("new_lst", l))}>{ph2("new_lst", l)}</Button>} content={<Section title={ph2("listings", l)} description={ph2("browse_s", l)}>{CONTENT_MOCK}</Section>} />;
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(z=g.parameters)===null||z===void 0||(O=z.docs)===null||O===void 0?void 0:O.source}}};const ie=["Default","TitleOnly","WithCountBadge","WithAction","WithActions","LocaleStress"];export{c as Default,g as LocaleStress,p as TitleOnly,m as WithAction,v as WithActions,u as WithCountBadge,ie as __namedExportsOrder,re as default};
