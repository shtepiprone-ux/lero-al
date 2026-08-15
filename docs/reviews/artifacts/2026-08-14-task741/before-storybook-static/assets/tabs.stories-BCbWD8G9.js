import{j as e}from"./iframe-BWqC60Cj.js";import{T as n,a as d,b as s,c as v}from"./tabs-CL8j7ACS.js";import{s as S}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./useControlled-COCwHvrc.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./CompositeList-S6-dMJcD.js";import"./CompositeRoot-CMY8qbI0.js";import"./inertValue-DeE1CYDS.js";import"./shadowDom-KUr5fxLu.js";import"./useButton-62N7Qls-.js";import"./DirectionContext-CtLbILH8.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./useCompositeItem-D48be0U8.js";import"./useTransitionStatus-C523vQjG.js";var m,p,T,x,_,f,h,j,L,y,w,N;const F={title:"Primitives/Tabs",tags:["autodocs"],parameters:{docs:{description:{component:"Canonical tab component. ALWAYS use shadcn Tabs instead of local tab button clones. Single style: primary-color underline indicator on active tab. Scrolls horizontally when tabs overflow the container. See docs/ui-rules.md §15a."}}}},a=(i,r="en")=>S(r,`storybook.tabs.${i}`),c={parameters:{docs:{description:{story:"Default tabs — canonical underline style. Use locale toolbar for sq/en/uk/it."}}},render:(i,r)=>{var t,o;const l=(o=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return e.jsxs(n,{defaultValue:"listings",className:"w-full max-w-lg",children:[e.jsxs(d,{children:[e.jsx(s,{value:"listings",children:a("my_listings",l)}),e.jsx(s,{value:"saved",children:a("saved",l)}),e.jsx(s,{value:"profile",children:a("profile",l)})]}),e.jsx(v,{value:"listings",children:e.jsx("p",{className:"text-sm text-muted-foreground p-4",children:a("content",l)})}),e.jsx(v,{value:"saved",children:e.jsx("p",{className:"text-sm text-muted-foreground p-4",children:a("saved_content",l)})}),e.jsx(v,{value:"profile",children:e.jsx("p",{className:"text-sm text-muted-foreground p-4",children:a("profile_content",l)})})]})}},b={render:(i,r)=>{var t,o;const l=(o=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return e.jsx("div",{className:"flex flex-col gap-6",children:e.jsx(n,{defaultValue:"a",children:e.jsxs(d,{children:[e.jsx(s,{value:"a",children:a("my_listings",l)}),e.jsx(s,{value:"b",children:a("saved_long",l)}),e.jsx(s,{value:"c",children:a("profile",l)})]})})})},parameters:{docs:{description:{story:"Long locale labels — shadcn Tabs handles wrapping correctly. Use locale toolbar."}}}},u={render:(i,r)=>{var t,o;const l=(o=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return e.jsx(n,{defaultValue:"active",children:e.jsxs(d,{children:[e.jsx(s,{value:"active",children:a("active",l)}),e.jsx(s,{value:"disabled",disabled:!0,children:a("drafts",l)}),e.jsx(s,{value:"other",children:a("closed",l)})]})})}},g={render:(i,r)=>{var t,o;const l=(o=r==null||(t=r.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return e.jsxs("div",{className:"flex flex-col gap-8 w-full max-w-xs",children:[e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground mb-3",children:a("many",l)}),e.jsx(n,{defaultValue:"active",className:"w-full",children:e.jsxs(d,{children:[e.jsx(s,{value:"active",children:a("active",l)}),e.jsx(s,{value:"closed",children:a("closed",l)}),e.jsx(s,{value:"pending",children:a("pending",l)}),e.jsx(s,{value:"drafts",children:a("drafts",l)}),e.jsx(s,{value:"archived",children:a("archived",l)})]})})]}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground mb-3",children:a("long_labels",l)}),e.jsx(n,{defaultValue:"a",className:"w-full",children:e.jsxs(d,{children:[e.jsx(s,{value:"a",children:a("my_listings",l)}),e.jsx(s,{value:"b",children:a("saved_long",l)}),e.jsx(s,{value:"c",children:a("profile_long",l)})]})})]})]})},parameters:{docs:{description:{story:"Tabs scroll horizontally when they overflow. Use locale toolbar for sq/en/uk/it."}}}};c.parameters={...c.parameters,docs:{...(m=c.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: 'Default tabs — canonical underline style. Use locale toolbar for sq/en/uk/it.'
      }
    }
  },
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Tabs defaultValue="listings" className="w-full max-w-lg">\r
        <TabsList>\r
          <TabsTrigger value="listings">{tb('my_listings', l)}</TabsTrigger>\r
          <TabsTrigger value="saved">{tb('saved', l)}</TabsTrigger>\r
          <TabsTrigger value="profile">{tb('profile', l)}</TabsTrigger>\r
        </TabsList>\r
        <TabsContent value="listings"><p className="text-sm text-muted-foreground p-4">{tb('content', l)}</p></TabsContent>\r
        <TabsContent value="saved"><p className="text-sm text-muted-foreground p-4">{tb('saved_content', l)}</p></TabsContent>\r
        <TabsContent value="profile"><p className="text-sm text-muted-foreground p-4">{tb('profile_content', l)}</p></TabsContent>\r
      </Tabs>;
  }
}`,...(T=c.parameters)===null||T===void 0||(p=T.docs)===null||p===void 0?void 0:p.source}}};b.parameters={...b.parameters,docs:{...(x=b.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-col gap-6">\r
        <Tabs defaultValue="a">\r
          <TabsList>\r
            <TabsTrigger value="a">{tb('my_listings', l)}</TabsTrigger>\r
            <TabsTrigger value="b">{tb('saved_long', l)}</TabsTrigger>\r
            <TabsTrigger value="c">{tb('profile', l)}</TabsTrigger>\r
          </TabsList>\r
        </Tabs>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Long locale labels — shadcn Tabs handles wrapping correctly. Use locale toolbar.'
      }
    }
  }
}`,...(f=b.parameters)===null||f===void 0||(_=f.docs)===null||_===void 0?void 0:_.source}}};u.parameters={...u.parameters,docs:{...(h=u.parameters)===null||h===void 0?void 0:h.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <Tabs defaultValue="active">\r
        <TabsList>\r
          <TabsTrigger value="active">{tb('active', l)}</TabsTrigger>\r
          <TabsTrigger value="disabled" disabled>{tb('drafts', l)}</TabsTrigger>\r
          <TabsTrigger value="other">{tb('closed', l)}</TabsTrigger>\r
        </TabsList>\r
      </Tabs>;
  }
}`,...(L=u.parameters)===null||L===void 0||(j=L.docs)===null||j===void 0?void 0:j.source}}};g.parameters={...g.parameters,docs:{...(y=g.parameters)===null||y===void 0?void 0:y.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <div className="flex flex-col gap-8 w-full max-w-xs">\r
        <div>\r
          <p className="text-xs text-muted-foreground mb-3">{tb('many', l)}</p>\r
          <Tabs defaultValue="active" className="w-full">\r
            <TabsList>\r
              <TabsTrigger value="active">{tb('active', l)}</TabsTrigger>\r
              <TabsTrigger value="closed">{tb('closed', l)}</TabsTrigger>\r
              <TabsTrigger value="pending">{tb('pending', l)}</TabsTrigger>\r
              <TabsTrigger value="drafts">{tb('drafts', l)}</TabsTrigger>\r
              <TabsTrigger value="archived">{tb('archived', l)}</TabsTrigger>\r
            </TabsList>\r
          </Tabs>\r
        </div>\r
        <div>\r
          <p className="text-xs text-muted-foreground mb-3">{tb('long_labels', l)}</p>\r
          <Tabs defaultValue="a" className="w-full">\r
            <TabsList>\r
              <TabsTrigger value="a">{tb('my_listings', l)}</TabsTrigger>\r
              <TabsTrigger value="b">{tb('saved_long', l)}</TabsTrigger>\r
              <TabsTrigger value="c">{tb('profile_long', l)}</TabsTrigger>\r
            </TabsList>\r
          </Tabs>\r
        </div>\r
      </div>;
  },
  parameters: {
    docs: {
      description: {
        story: 'Tabs scroll horizontally when they overflow. Use locale toolbar for sq/en/uk/it.'
      }
    }
  }
}`,...(N=g.parameters)===null||N===void 0||(w=N.docs)===null||w===void 0?void 0:w.source}}};const G=["Default","WithLongLocaleLabels","Disabled","MobileScroll"];export{c as Default,u as Disabled,g as MobileScroll,b as WithLongLocaleLabels,G as __namedExportsOrder,F as default};
