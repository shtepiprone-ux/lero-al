import{j as e}from"./iframe-BWqC60Cj.js";import{B as g}from"./button-DqckHWPj.js";import{P as _,a as x,b as P,c as b,d as h,e as f}from"./popover-CTqmbuqI.js";import{s as j}from"./_storyI18n-DUPbxmag.js";import"./preload-helper-Dp1pzeXC.js";import"./index-D4MQtXW4.js";import"./utils-D5ceN5oG.js";import"./useButton-62N7Qls-.js";import"./useIsoLayoutEffect-BlzvCgLy.js";import"./useRenderElement-DCWLj8DQ.js";import"./mobile-bottom-sheet-tha1BKbV.js";import"./useOpenInteractionType-D7GLRI-3.js";import"./useInteractions-CUNok2Pe.js";import"./useTransitionStatus-C523vQjG.js";import"./createBaseUIEventDetails-urpO65QN.js";import"./inertValue-DeE1CYDS.js";import"./visuallyHidden-COI6QeQH.js";import"./shadowDom-KUr5fxLu.js";import"./index-DTzEXCUc.js";import"./useValueChanged-DYbhOE3F.js";import"./useRole-BHvzd0LU.js";import"./getEmptyRootContext-CBnq-fR5.js";import"./useTriggerFocusGuards-BRKpHu-Z.js";import"./safePolygon-B3UYXLcm.js";import"./usePositioner-6ZAe_XXl.js";import"./DirectionContext-CtLbILH8.js";import"./useAnchoredPopupScrollLock-B9Vs29W1.js";var p,d,c,m,v,u;const W={title:"Primitives/Popover",tags:["autodocs"],parameters:{docs:{description:{component:"Base-UI Popover primitive. At <640px renders as a full-width bottom sheet."}}}},t=(i,o="en")=>j(o,`storybook.popover.${i}`),s={render:(i,o)=>{var n,l;const r=(l=o==null||(n=o.globals)===null||n===void 0?void 0:n.locale)!==null&&l!==void 0?l:"en";return e.jsxs(_,{children:[e.jsx(x,{render:e.jsx(g,{variant:"outline",children:t("open",r)})}),e.jsxs(P,{children:[e.jsxs(b,{children:[e.jsx(h,{children:t("title",r)}),e.jsx(f,{children:t("desc",r)})]}),e.jsx("p",{className:"text-sm text-muted-foreground",children:t("body",r)})]})]})}},a={parameters:{docs:{description:{story:"@320: popover opens as a full-width bottom sheet — edge-to-edge, drag handle. Use locale toolbar."}}},render:(i,o)=>{var n,l;const r=(l=o==null||(n=o.globals)===null||n===void 0?void 0:n.locale)!==null&&l!==void 0?l:"en";return e.jsx("div",{className:"p-4",children:e.jsxs(_,{defaultOpen:!0,children:[e.jsx(x,{render:e.jsx(g,{children:t("open_long",r)})}),e.jsxs(P,{children:[e.jsxs(b,{children:[e.jsx(h,{children:t("title_long",r)}),e.jsx(f,{children:t("desc_long",r)})]}),e.jsx("p",{className:"text-sm text-muted-foreground",children:t("body_long",r)})]})]})})},globals:{viewport:{value:"mobile320",isRotated:!1}}};s.parameters={...s.parameters,docs:{...(p=s.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <Popover>\r
        <PopoverTrigger render={<Button variant="outline">{p("open", locale)}</Button>} />\r
        <PopoverContent>\r
          <PopoverHeader>\r
            <PopoverTitle>{p("title", locale)}</PopoverTitle>\r
            <PopoverDescription>{p("desc", locale)}</PopoverDescription>\r
          </PopoverHeader>\r
          <p className="text-sm text-muted-foreground">{p("body", locale)}</p>\r
        </PopoverContent>\r
      </Popover>;
  }
}`,...(c=s.parameters)===null||c===void 0||(d=c.docs)===null||d===void 0?void 0:d.source}}};a.parameters={...a.parameters,docs:{...(m=a.parameters)===null||m===void 0?void 0:m.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: "@320: popover opens as a full-width bottom sheet — edge-to-edge, drag handle. Use locale toolbar."
      }
    }
  },
  render: (_, context) => {
    const locale = context?.globals?.locale as string ?? "en";
    return <div className="p-4">\r
        <Popover defaultOpen>\r
          <PopoverTrigger render={<Button>{p("open_long", locale)}</Button>} />\r
          <PopoverContent>\r
            <PopoverHeader>\r
              <PopoverTitle>{p("title_long", locale)}</PopoverTitle>\r
              <PopoverDescription>{p("desc_long", locale)}</PopoverDescription>\r
            </PopoverHeader>\r
            <p className="text-sm text-muted-foreground">{p("body_long", locale)}</p>\r
          </PopoverContent>\r
        </Popover>\r
      </div>;
  },
  globals: {
    viewport: {
      value: "mobile320",
      isRotated: false
    }
  }
}`,...(u=a.parameters)===null||u===void 0||(v=u.docs)===null||v===void 0?void 0:v.source}}};const X=["Default","MobileBottomSheet"];export{s as Default,a as MobileBottomSheet,X as __namedExportsOrder,W as default};
