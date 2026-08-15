import{j as k}from"./iframe-BWqC60Cj.js";import{N as S}from"./NotificationItem-BhyCYf6P.js";import"./preload-helper-Dp1pzeXC.js";import"./utils-D5ceN5oG.js";import"./formatters-BY5HUnlf.js";import"./mutations-dEw605Fm.js";import"./admin-OMykPQmP.js";import"./warnDeprecatedPackage-SJ_BeofI.js";import"./server-DtWDQ7N5.js";import"./listingStatusLabel-f-vyNeb6.js";import"./index-PXfbuUw3.js";import"./uk-CkiOKF_n.js";import"./en-US-BBmapk28.js";var o,s,n,l,d,p,m,c,u,_,v,h,g,f,y;const R="2026-07-30T00:00:00.000Z";function e(t){return{user_id:"user-1",link:null,is_read:!1,created_at:R,template_id:null,template_params:null,...t}}const b=[e({id:"1",type:"saved_search_match",title:"Kërkim i ruajtur: Apartament 2+1 Tiranë",body:"3 listim të reja",template_id:"saved_search_match",template_params:{searchName:"Apartament 2+1 Tiranë, Qendër, deri 120,000 EUR",count:3},link:"/sq/listings"}),e({id:"2",type:"price_change",title:"Ndryshim çmimi: Vilë private me oborr dhe pishinë, Durrës",body:"180,000 EUR → 165,000 EUR",template_id:"price_change",template_params:{oldPrice:18e4,newPrice:165e3,currency:"EUR",listingName:"Vilë private me oborr dhe pishinë, Durrës",listingId:"listing-1"},link:"/sq/listings/listing-1",is_read:!0}),e({id:"3",type:"support_reply",title:"Ankesë për llogarinë tuaj",body:"Administratori ka hapur një ankesë lidhur me llogarinë tuaj. Ekipi ynë do ta shqyrtojë.",template_id:"support_created",template_params:{}}),e({id:"4",type:"report_outcome",title:"Çështja juaj u zgjidh",body:"Ankesa lidhur me llogarinë tuaj u shqyrtua dhe u zgjidh nga ekipi ynë.",template_id:"support_resolved",template_params:{},is_read:!0}),e({id:"5",type:"report_outcome",title:"Raporti juaj u shqyrtua",body:"Faleminderit për raportimin tuaj. Ne kemi shqyrtuar ankesën dhe kemi ndërmarrë hapat e nevojshëm.",template_id:"report_resolved",template_params:{},is_read:!0}),e({id:"6",type:"saved_search_match",title:"Kërkim i ruajtur: Tokë / Truall Vlorë",body:"7",template_id:null,template_params:null,link:"/sq/listings"}),e({id:"7",type:"listing_status_change",title:"Statusi i listimit u ndryshua",body:JSON.stringify({from:"pending",to:"active"}),template_id:null,template_params:null,is_read:!0,link:"/sq/listings/listing-2"}),e({id:"8",type:"marketing",title:"Mirë se vini në Lero.al",body:"Eksploroni listimet më të fundit në platformën tonë.",template_id:null,template_params:null,is_read:!0})],I={title:"Notifications/NotificationItem",component:S,tags:["autodocs"],args:{onRead:()=>{}}},a={render:()=>k.jsx("div",{className:"w-80 max-h-120 flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg divide-y",children:b.map(t=>k.jsx(S,{notification:t,onRead:()=>{}},t.id))}),globals:{viewport:{value:"mobile390",isRotated:!1}}},r={args:{notification:b[1],onRead:()=>{}},globals:{viewport:{value:"mobile320",isRotated:!1}}},i={args:{notification:b[0],onRead:()=>{}},globals:{viewport:{value:"mobile320",isRotated:!1}}};a.parameters={...a.parameters,docs:{...(o=a.parameters)===null||o===void 0?void 0:o.docs,source:{originalSource:`{
  render: () => <div className="w-80 max-h-120 flex flex-col overflow-hidden rounded-xl border bg-background shadow-lg divide-y">\r
      {ROWS.map(row => <NotificationItem key={row.id} notification={row} onRead={() => {}} />)}\r
    </div>,
  globals: {
    viewport: {
      value: 'mobile390',
      isRotated: false
    }
  }
}`,...(n=a.parameters)===null||n===void 0||(s=n.docs)===null||s===void 0?void 0:s.source},description:{story:"All Task 319 producer cases + legacy fallbacks, stacked inside the real\r\n`w-80` (320px) NotificationCenter list container — mirrors the bell dropdown.",...(d=a.parameters)===null||d===void 0||(l=d.docs)===null||l===void 0?void 0:l.description}}};r.parameters={...r.parameters,docs:{...(p=r.parameters)===null||p===void 0?void 0:p.docs,source:{originalSource:`{
  args: {
    notification: ROWS[1],
    onRead: () => {}
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(c=r.parameters)===null||c===void 0||(m=c.docs)===null||m===void 0?void 0:m.source},description:{story:"Single price_change row, unread, mobile320 — focuses on the long listing name + ICU price params.",...(_=r.parameters)===null||_===void 0||(u=_.docs)===null||u===void 0?void 0:u.description}}};i.parameters={...i.parameters,docs:{...(v=i.parameters)===null||v===void 0?void 0:v.docs,source:{originalSource:`{
  args: {
    notification: ROWS[0],
    onRead: () => {}
  },
  globals: {
    viewport: {
      value: 'mobile320',
      isRotated: false
    }
  }
}`,...(g=i.parameters)===null||g===void 0||(h=g.docs)===null||h===void 0?void 0:h.source},description:{story:"Single saved_search_match row with a long search name — title param wrap check.",...(y=i.parameters)===null||y===void 0||(f=y.docs)===null||f===void 0?void 0:f.description}}};const W=["AllCases","PriceChangeUnread","SavedSearchMatchUnread"];export{a as AllCases,r as PriceChangeUnread,i as SavedSearchMatchUnread,W as __namedExportsOrder,I as default};
