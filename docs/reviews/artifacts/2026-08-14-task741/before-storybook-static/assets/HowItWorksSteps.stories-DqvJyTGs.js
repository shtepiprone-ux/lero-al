import{j as e,h}from"./iframe-BWqC60Cj.js";import{s as f}from"./_storyI18n-DUPbxmag.js";import{M as x}from"./_MantineStoryShell-v1yXHo2n.js";import{S as v}from"./typography-DgVg8aJb.js";import{T as g}from"./Title-pnvfNB3M.js";import{S}from"./SimpleGrid-KrH1v0nV.js";import{S as y}from"./Stack-DqzY2ynC.js";import{T as p}from"./ThemeIcon-DREj4u5X.js";import{S as w}from"./search-D3-0jNs5.js";import{H as k}from"./house-mS3JtSOa.js";import{P as T}from"./phone-CZ1sHUGw.js";import{T as m}from"./Text-ZiglToyN.js";import"./preload-helper-Dp1pzeXC.js";import"./createLucideIcon-DZTr3VOw.js";const j=[w,k,T];function u({heading:d,steps:o}){return e.jsxs(e.Fragment,{children:[e.jsx(g,{order:2,ta:"center",fw:700,fz:v,mb:40,children:d}),e.jsx(S,{cols:{base:1,sm:3},spacing:32,maw:768,mx:"auto",children:o.map((t,r)=>{const i=j[r];return e.jsxs(y,{align:"center",ta:"center",gap:"sm",children:[e.jsxs(h,{pos:"relative",children:[e.jsx(p,{size:56,radius:"2xl",color:"brand",variant:"light",children:e.jsx(i,{size:24})}),e.jsx(p,{size:24,radius:"pill",color:"brand",variant:"filled",pos:"absolute",fz:"xs",fw:700,style:{top:"calc(var(--mantine-spacing-xs) * -1)",right:"calc(var(--mantine-spacing-xs) * -1)"},children:r+1})]}),e.jsx(m,{component:"h3",fw:600,size:"md",children:t.title}),e.jsx(m,{size:"sm",c:"dimmed",children:t.desc})]},t.title)})})]})}u.__docgenInfo={description:`Presentational "How it works" section — Mantine primitives + theme tokens only.
Prop-driven, hook-free (no useTranslations) so it renders identically in the story via
storyT() and in the future page.tsx consumer (Task 645).`,methods:[],displayName:"HowItWorksSteps",props:{heading:{required:!0,tsType:{name:"string"},description:""},steps:{required:!0,tsType:{name:"unknown"},description:"Exactly 3 steps — icons (Search/Home/Phone) and numbers (1/2/3) are owned internally by index."}}};var a,l,c;const G={title:"Mantine/Primitives/HowItWorksSteps",parameters:{skipCanvas:!0,layout:"fullscreen"}},n={render:(d,o)=>{var t,r;const i=(r=o==null||(t=o.globals)===null||t===void 0?void 0:t.locale)!==null&&r!==void 0?r:"en",s=_=>f(i,`home.${_}`);return e.jsx(x,{children:e.jsx(u,{heading:s("how_it_works"),steps:[{title:s("step1_title"),desc:s("step1_desc")},{title:s("step2_title"),desc:s("step2_desc")},{title:s("step3_title"),desc:s("step3_desc")}]})})}};n.parameters={...n.parameters,docs:{...(a=n.parameters)===null||a===void 0?void 0:a.docs,source:{originalSource:`{
  render: (_args, context) => {
    const locale = context?.globals?.locale as string ?? 'en';
    const t = (key: string) => storyT(locale, \`home.\${key}\`);
    return <MantineStoryShell>\r
        <HowItWorksSteps heading={t('how_it_works')} steps={[{
        title: t('step1_title'),
        desc: t('step1_desc')
      }, {
        title: t('step2_title'),
        desc: t('step2_desc')
      }, {
        title: t('step3_title'),
        desc: t('step3_desc')
      }]} />\r
      </MantineStoryShell>;
  }
}`,...(c=n.parameters)===null||c===void 0||(l=c.docs)===null||l===void 0?void 0:l.source}}};const $=["Default"];export{n as Default,$ as __namedExportsOrder,G as default};
