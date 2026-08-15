import{j as r}from"./iframe-BWqC60Cj.js";import{B as _}from"./button-DqckHWPj.js";import{s as L}from"./_storyI18n-DUPbxmag.js";import{H as B}from"./house-mS3JtSOa.js";import{H as w}from"./heart-D83DUq8K.js";import{S as k}from"./search-D3-0jNs5.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./createLucideIcon-DZTr3VOw.js";var u,p,v,x,g,f,S,b,h,N,y,j;const G={title:"System/EmptyState",tags:["autodocs"],parameters:{docs:{description:{component:"Canonical empty state pattern. See docs/tailwind-canonical-fragments.md §10."}}}},l=(i,e="en")=>L(e,`storybook.emptystate.${i}`);function m({icon:i,title:e,description:t,action:o}){return r.jsxs("div",{"data-testid":"empty-state",className:"flex flex-col items-center justify-center py-24 gap-4 text-center",children:[r.jsx("div",{className:"h-16 w-16 rounded-2xl bg-muted flex items-center justify-center",children:r.jsx(i,{className:"h-8 w-8 text-muted-foreground"})}),r.jsxs("div",{className:"space-y-1 max-w-sm",children:[r.jsx("h3",{className:"text-lg font-semibold",children:e}),r.jsx("p",{className:"text-sm text-muted-foreground",children:t})]}),o]})}const a={render:(i,e)=>{var t,o;const s=(o=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return r.jsx(m,{icon:B,title:l("no_listings_title",s),description:l("no_listings_desc",s),action:r.jsx(_,{size:"xl",variant:"outline",children:l("clear_filters",s)})})}},n={render:(i,e)=>{var t,o;const s=(o=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return r.jsx(m,{icon:w,title:l("no_saved_title",s),description:l("no_saved_desc",s),action:r.jsx(_,{size:"xl",children:l("browse",s)})})}},c={render:(i,e)=>{var t,o;const s=(o=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return r.jsx(m,{icon:k,title:l("no_results_title",s),description:l("no_results_desc",s),action:r.jsx(_,{size:"xl",variant:"outline",children:l("modify_search",s)})})}},d={render:(i,e)=>{var t,o;const s=(o=e==null||(t=e.globals)===null||t===void 0?void 0:t.locale)!==null&&o!==void 0?o:"en";return r.jsx(m,{icon:B,title:l("no_listings_title",s),description:l("no_listings_desc",s),action:r.jsx(_,{size:"xl",variant:"outline",children:l("clear_filters",s)})})},parameters:{docs:{description:{story:"Locale stress — longer text must fit within max-w-sm. Use locale toolbar for sq/en/uk/it."}}}};a.parameters={...a.parameters,docs:{...(u=a.parameters)===null||u===void 0?void 0:u.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <EmptyStateBlock icon={Home} title={e('no_listings_title', l)} description={e('no_listings_desc', l)} action={<Button size="xl" variant="outline">{e('clear_filters', l)}</Button>} />;
  }
}`,...(v=a.parameters)===null||v===void 0||(p=v.docs)===null||p===void 0?void 0:p.source}}};n.parameters={...n.parameters,docs:{...(x=n.parameters)===null||x===void 0?void 0:x.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <EmptyStateBlock icon={Heart} title={e('no_saved_title', l)} description={e('no_saved_desc', l)} action={<Button size="xl">{e('browse', l)}</Button>} />;
  }
}`,...(f=n.parameters)===null||f===void 0||(g=f.docs)===null||g===void 0?void 0:g.source}}};c.parameters={...c.parameters,docs:{...(S=c.parameters)===null||S===void 0?void 0:S.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <EmptyStateBlock icon={Search} title={e('no_results_title', l)} description={e('no_results_desc', l)} action={<Button size="xl" variant="outline">{e('modify_search', l)}</Button>} />;
  }
}`,...(h=c.parameters)===null||h===void 0||(b=h.docs)===null||b===void 0?void 0:b.source}}};d.parameters={...d.parameters,docs:{...(N=d.parameters)===null||N===void 0?void 0:N.docs,source:{originalSource:`{
  render: (_, context) => {
    const l = context?.globals?.locale as string ?? 'en';
    return <EmptyStateBlock icon={Home} title={e('no_listings_title', l)} description={e('no_listings_desc', l)} action={<Button size="xl" variant="outline">{e('clear_filters', l)}</Button>} />;
  },
  parameters: {
    docs: {
      description: {
        story: 'Locale stress — longer text must fit within max-w-sm. Use locale toolbar for sq/en/uk/it.'
      }
    }
  }
}`,...(j=d.parameters)===null||j===void 0||(y=j.docs)===null||y===void 0?void 0:y.source}}};const I=["NoListings","NoFavorites","NoSearchResults","LocaleStress"];export{d as LocaleStress,n as NoFavorites,a as NoListings,c as NoSearchResults,I as __namedExportsOrder,G as default};
