import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RELIEF_ASSETS } from './assets/reliefs-v2/manifest.js';
import { createColumnByType, COLUMN_METADATA } from './columns-v4.js';
import { findV18ObjectInfo } from './object-info-v18.js';


const I18N = Object.freeze({
  ar: {
    'meta.title':'معبد باستت — إعادة بناء ثلاثية الأبعاد V18.0',
    'meta.description':'تصور ثلاثي الأبعاد تفاعلي لمعبد باستت — V18.0 مع تنفيذ ملاحظات الدكتور: الفناء المفتوح، المجمع متعدد الحجرات، النقوش العميقة، والإضاءة المتدرجة',
    'app.aria':'نموذج معبد باستت ثلاثي الأبعاد','brand.title':'معبد باستت — تل بسطة','brand.subtitle':'V18.0 — إعادة بناء بحثية: التسلسل العام مؤيد، والتفاصيل غير المحفوظة معلّمة بوضوح كمرجحة أو تفسيرية',
    'nav.aria':'أدوات العرض','nav.home':'🏠 الرئيسية','nav.overview':'المشهد الكامل','nav.top':'المخطط العلوي','nav.entrance':'المدخل','nav.hebsed':'عيد الحِب-سِد','nav.hathor':'الفناء الحتحوري المفتوح','nav.osorkon':'بوابة أوسركون','nav.sanctuary':'قدس الأقداس (داخل 30)','nav.walk':'وضع المشي','nav.guided':'الجولة الآلية','nav.presentation':'وضع العرض',
    'language.button':'🌐 English','language.aria':'التبديل إلى اللغة الإنجليزية',
    'audio.play':'🔊 تشغيل الصوت','audio.pause':'⏸ إيقاف مؤقت','audio.ariaPlay':'تشغيل الشرح الصوتي العربي','audio.ariaPause':'إيقاف الشرح الصوتي العربي مؤقتًا','audio.error':'تعذر تشغيل الملف الصوتي العربي',
    'info.close':'إغلاق لوحة المعلومات','info.imageAlt':'مرجع بصري للعنصر المحدد','info.period':'الفترة','info.material':'المادة','info.confidence':'درجة اليقين','info.type':'النوع','info.source':'المصدر','info.focus':'التركيز على العنصر','info.return':'العودة للمشهد السابق','info.openSource':'فتح المصدر','info.zoom':'تكبير الكتابة','info.explainScripts':'شرح اليونانية والديموطيقية','info.unspecified':'غير محدد','info.defaultNote':'المعلومات مرتبطة بنوع العنصر أو منطقته؛ تفاصيل الشكل والموضع قد تكون تفسيرية كما توضح درجة اليقين.','info.visualRef':'مرجع بصري',
    'walk.cursorHint':'انقر على عنصر لعرض معلوماته — أو اضغط E لفحص ما أمامك','walk.title':'وضع المشي','walk.instructions':'W أو ↑ للأمام — S أو ↓ للخلف — A وD أو ← → جانبيًا — Shift للإسراع — اسحب بزر الماوس الأيمن أو بإصبعك للنظر — انقر أو اضغط E للفحص','walk.touchAria':'أزرار الحركة باللمس','walk.forward':'تحرك إلى الأمام','walk.left':'تحرك إلى اليسار','walk.back':'تحرك إلى الخلف','walk.right':'تحرك إلى اليمين','walk.exit':'إنهاء المشي',
    'presentation.exit':'إنهاء وضع العرض','layers.aria':'طبقات العرض الأثري','layers.title':'طبقات العرض','layers.evidence':'علامات ارتباط بالدليل (ليست in situ)','layers.reconstruction':'إعادة البناء','layers.pigment':'آثار الصبغات','export.aria':'التصدير','export.png':'حفظ PNG','export.glb':'تصدير GLB','export.working':'جارٍ التصدير…','export.error':'تعذّر تصدير GLB. راجع وحدة التحكم.',
    'modal.close':'إغلاق','canopus.title':'جزء مرسوم كانوب — عرض تعليمي','canopus.imageAlt':'رسم تخطيطي تعليمي لجزء مرسوم كانوب','canopus.caption':'رسم تخطيطي تعليمي داخل الجولة، وليس صورة للقطعة الأصلية أو تحديدًا لموضعها الأصلي.','canopus.scriptsTitle':'الكتابتان الظاهرتان على الجزء المكتشف','canopus.demotic':'<strong>الديموطيقية:</strong> خط مصري متأخر سريع الكتابة استُخدم في الوثائق والنصوص الرسمية.','canopus.greek':'<strong>اليونانية:</strong> إحدى لغات المرسوم في العصر البطلمي، وتساعد على مقارنة مضمون النص بين اللغات.','canopus.findspot':'عُثر على الجزء في صالة مدخل المعبد، أما موضع النموذج داخل الجولة فهو تفسيري فقط.',
    'loading.title':'جارٍ تحميل نسخة V18.0 المُحسَّنة ومراجعة التنفيذ وفق ملاحظات الدكتورة…','loading.detail':'تجهيز الطبقات، وضبط المحور، ومراجعة النقوش، والناووس، وقدس الأقداس','loading.error':'حدث خطأ',
    'zone.inside':'داخل العنصر الأثري {archaeologicalId}','zone.label':'المنطقة {id} = العنصر الأثري {archaeologicalId}','relief.badge':'نقش — المنطقة {zone}','relief.attested':'موثق/جزئيًا','relief.contextual':'سياقي','relief.interpretive':'تفسيري','relief.description':'لوحة نقش مجسمة بخريطة ارتفاع وNormal Map. موضع اللوحة داخل هذه القاعة قد يكون تفسيريًا حتى عندما يكون المشهد نفسه موثقًا.','relief.type':'نقش بارز ثلاثي الأبعاد','relief.period':'يرتبط بالمشهد والمنطقة','relief.material':'حجر/جرانيت','column.badge':'عمود موثق النوع','label.relief':'نقش','label.column':'عمود','label.architecture':'عنصر معماري'
  },
  en: {
    'meta.title':'Temple of Bastet — Interactive 3D Reconstruction V18.0',
    'meta.description':'Interactive 3D visualization of the Temple of Bastet — V18.0, including the open courtyard, multi-room complex, deeper reliefs, and progressive lighting.',
    'app.aria':'Interactive 3D model of the Temple of Bastet','brand.title':'Temple of Bastet — Tell Basta','brand.subtitle':'V18.0 — Research reconstruction: the overall sequence is supported; unpreserved details are clearly marked as probable or interpretive.',
    'nav.aria':'View controls','nav.home':'🏠 Home','nav.overview':'Full View','nav.top':'Top Plan','nav.entrance':'Entrance','nav.hebsed':'Heb-Sed Festival','nav.hathor':'Open Hathoric Courtyard','nav.osorkon':'Osorkon Gateway','nav.sanctuary':'Sanctuary (inside 30)','nav.walk':'Walk Mode','nav.guided':'Guided Tour','nav.presentation':'Presentation Mode',
    'language.button':'🌐 العربية','language.aria':'Switch to Arabic',
    'audio.play':'🔊 Play Audio','audio.pause':'⏸ Pause Audio','audio.ariaPlay':'Play the English audio narration','audio.ariaPause':'Pause the English audio narration','audio.error':'Unable to play the English audio narration',
    'info.close':'Close information panel','info.imageAlt':'Visual reference for the selected object','info.period':'Period','info.material':'Material','info.confidence':'Confidence','info.type':'Type','info.source':'Source','info.focus':'Focus on Object','info.return':'Return to Previous View','info.openSource':'Open Source','info.zoom':'Enlarge Inscription','info.explainScripts':'Explain Greek and Demotic','info.unspecified':'Not specified','info.defaultNote':'This information refers to the object type or its area; details of form and placement may be interpretive, as indicated by the confidence grade.','info.visualRef':'Visual reference',
    'walk.cursorHint':'Click an object to view its information — or press E to inspect what is in front of you','walk.title':'Walk Mode','walk.instructions':'W or ↑ forward — S or ↓ backward — A/D or ←/→ sideways — Shift to sprint — drag with the right mouse button or a finger to look — click or press E to inspect','walk.touchAria':'Touch movement controls','walk.forward':'Move forward','walk.left':'Move left','walk.back':'Move backward','walk.right':'Move right','walk.exit':'Exit Walk Mode',
    'presentation.exit':'Exit Presentation Mode','layers.aria':'Archaeological display layers','layers.title':'Display Layers','layers.evidence':'Evidence-association markers (not in situ)','layers.reconstruction':'Reconstruction','layers.pigment':'Pigment traces','export.aria':'Export controls','export.png':'Save PNG','export.glb':'Export GLB','export.working':'Exporting…','export.error':'Unable to export the GLB file. Check the browser console.',
    'modal.close':'Close','canopus.title':'Canopus Decree Fragment — Educational View','canopus.imageAlt':'Educational schematic of the Canopus Decree fragment','canopus.caption':'An educational schematic used in the tour; it is not a photograph of the original object and does not identify its original position.','canopus.scriptsTitle':'The two scripts visible on the discovered fragment','canopus.demotic':'<strong>Demotic:</strong> A cursive late Egyptian script used in documents and official texts.','canopus.greek':'<strong>Greek:</strong> One of the decree’s languages in the Ptolemaic period, allowing the text to be compared across languages.','canopus.findspot':'The fragment was found in the temple entrance hall; its position in this digital tour is interpretive only.',
    'loading.title':'Loading the enhanced V18.0 reconstruction and applying the final review notes…','loading.detail':'Preparing layers, aligning the axis, and reviewing reliefs, the naos, and the sanctuary','loading.error':'An error occurred',
    'zone.inside':'Inside archaeological element {archaeologicalId}','zone.label':'Zone {id} = archaeological element {archaeologicalId}','relief.badge':'Relief — Zone {zone}','relief.attested':'Attested/partly attested','relief.contextual':'Contextual','relief.interpretive':'Interpretive','relief.description':'A modeled relief panel using a height map and Normal Map. Its placement in this hall may be interpretive even when the depicted scene itself is attested.','relief.type':'3D relief panel','relief.period':'Associated with the scene and area','relief.material':'Stone/granite','column.badge':'Attested column type','label.relief':'Relief','label.column':'Column','label.architecture':'Architectural element'
  }
});

const OBJECT_INFO_EN = Object.freeze({
  'Nectanebo II red-granite naos': {badge:'Probable reconstruction — EA1078–EA1080',title:'Nectanebo II Naos from Tell Basta',description:'A digital reconstruction based on naos fragments preserved in the British Museum. The fragments and their origin at Tell Basta are attested, but the museum record notes documentation confusion around EA1078–EA1080 and describes the published reconstruction as problematic. The complete form, dimensions, and present placement are therefore not archaeologically certain.',confidence:'PROBABLE/INTERPRETIVE — the fragments are ATTESTED; the complete form and precise placement remain unresolved',type:'Naos / stone shrine',material:'Dark red granite with subtle visual weathering',period:'Nectanebo II — Thirtieth Dynasty',source:'British Museum EA1078, EA1079 and EA1080; Figures 37, 38 and 45'},
  'Engraved granite star ceiling': {badge:'Probable reconstruction — Figure 33',title:'Granite Ceiling with Engraved Stars',description:'A stone ceiling with repeated incised stars and no self-illumination. Faint pigment traces can be enabled as a separate layer and do not represent a fully attested recoloring.',confidence:'PROBABLE — the decorative type is attested; the complete distribution is reconstructed',type:'Engraved stone ceiling',material:'Granite',period:'Nectanebo II',source:'Figure 33 — granite ceiling fragment with star decoration from the temple of Nectanebo II'},
  'Nectanebo II temple lintel': {badge:'Probable reconstruction — Figure 34',title:'Nectanebo II Temple Lintel',description:'A granite lintel with an inscription band and a simplified religious scene. The preserved fragment is the direct reference; completion of the full display is probable.',confidence:'PROBABLE — based on a preserved archaeological fragment',type:'Door lintel',material:'Red granite',period:'Nectanebo II',source:'Figure 34 — fragment of a doorway lintel from the temple of Nectanebo II'},
  'Interpretive cult statue of Bastet': {badge:'Interpretive element',title:'Bastet Statue inside the Naos Niche',description:'An interpretive statue marking the cult focus inside the niche. The original cult image is not preserved well enough for a certain reconstruction.',confidence:'INTERPRETIVE — hypothetical and included for the tour',type:'Interpretive cult statue',material:'Interpretive bronze',period:'Not specified for the digital form',source:'Function of the naos and the cult of Bastet; the digital form is not attested'},
  'Canopus Decree information point': {badge:'Information point — interpretive display position',title:'Canopus Decree',description:'A fragment of the Canopus Decree was found in the entrance hall of the Temple of Bastet. The model presents the information only and does not claim that its digital position is the original findspot.',confidence:'Association with the entrance hall is attested; display position is INTERPRETIVE',type:'Information Hotspot',material:'Interpretive dark stone / basalt',period:'Ptolemy III',source:'Canopus Decree — Tell Basta'},
  'Probable Heb-Sed ceremonial kiosk': {badge:'Probable reconstruction',title:'Ceremonial Kiosk in the Heb-Sed Hall',description:'A small kiosk that helps communicate the hall’s ceremonial function. Kiosks are attested in the relief program, but this kiosk’s position and dimensions in the tour are probable.',confidence:'PROBABLE — the function is attested; the position is reconstructed',type:'Ceremonial kiosk',material:'Red granite',period:'Osorkon II',source:'Louvre E10592; Penn Museum E225; Naville 1892'},
  'Red-granite palmiform column': {badge:'Attested element — EA1065',title:'Red-Granite Palmiform Column',description:'A palmiform column from the Temple of Bastet bearing the names and titles of Ramesses II, with parts of some cartouches recut for Osorkon II. The digital copies follow the published object type and dimensions, while their positions in the plan are interpretive.',confidence:'Directly attested in type and object; digital placement is interpretive',type:'Palmiform column',material:'Red granite',period:'Ramesses II; reused under Osorkon II',source:'British Museum EA1065'},
  'Hathor capital and colossal column': {badge:'Attested element — EA1107',title:'Hathoric Column in the Open Courtyard',description:'EA1107 is the direct reference for the Hathoric capital and the presence of four columns. In V18, Zone 29 is implemented as an independent open-air courtyard following the review request. The columns are visually based on the reference, while the open courtyard and their distribution are explicitly interpretive.',confidence:'The capital and number of columns are attested; the open courtyard and digital distribution are INTERPRETIVE',type:'Hathoric capital and colossal column in an open courtyard',material:'Visually weathered red granite',period:'Twenty-Second Dynasty',source:'British Museum EA1107; Egyptian Ministry of Tourism and Antiquities'},
  'Osorkon II Heb-Sed gateway and festival complex': {badge:'Osorkon II Complex',title:'Heb-Sed Gateway and Festival Hall',description:'Osorkon II erected a monumental gateway decorated with scenes of his Heb-Sed festival. Published reliefs and granite blocks attest the ceremonial program; the full height and assembled gateway in the model are interpretive reconstructions.',confidence:'The program and reliefs are attested; full height and digital assembly are interpretive',type:'Gateway and ceremonial complex',material:'Red-granite elements with reconstructed stone walls',period:'Reign of Osorkon II',source:'Egyptian Ministry of Tourism and Antiquities; British Museum EA1105'},
  'Sanctuary and shrine of Bastet': {badge:'Sacred Area',title:'Sanctuary and Shrine of Bastet',description:'The far western end containing the sanctuary was renovated under Nectanebo II. The shrine form, star ceiling, and ritual furnishings in the model are conservative interpretive reconstructions.',confidence:'The period and general subject are attested; the complete form is interpretive',type:'Sanctuary and sacred shrine',material:'Stone walls; naos and key elements in dark red granite',period:'Thirtieth Dynasty — Nectanebo II',source:'Egyptian Ministry of Tourism and Antiquities; British Museum EA1106'},
  'Column capital or upper architectural member': {badge:'Column Detail',title:'Column Capital or Upper Architectural Member',description:'An upper element that transfers loads from the beam to the shaft and gives the column its plant or Hathoric identity. Reconstructed details vary according to the column type and preservation of the original object.',confidence:'Attested in some examples; reconstructed parts vary by object',type:'Column capital / Abacus',material:'Limestone, sandstone, or red granite depending on the area',period:'According to the hall and column type',source:'Project column data and references EA1065 and EA1107'},
  'Stone base or podium': {badge:'Architectural Detail',title:'Stone Base or Podium',description:'A base supporting a column or sacred element and separating it from the floor. Detailed proportions of some bases are conservatively reconstructed.',confidence:'Architectural function is certain; detailed dimensions are interpretive',type:'Base / podium',material:'Stone block or red granite depending on the element',period:'According to the area',source:'Conservative architectural reconstruction'},
  'Papyrus-bundle column': {badge:'Architectural Element',title:'Papyrus-Bundle Column',description:'Official sources describe a portico and hypostyle hall in the western section containing papyrus-bundle and Hathoric columns. Exact proportions and positions of individual digital columns are interpretive.',confidence:'The column type is attested; detailed proportions and positions are interpretive',type:'Egyptian plant column',material:'Stone or granite depending on the hall',period:'Twenty-Second Dynasty in the western section',source:'Egyptian Ministry of Tourism and Antiquities — Temple of Bastet'},
  'Temple gateway or pylon entrance': {badge:'Architectural Entrance',title:'Temple Gateway or Pylon Entrance',description:'A gateway on the temple’s ritual axis. The overall sequence is supported, but the Area A excavation report states that the first pylon was completely dismantled without leaving a trace. Its digital form, height, and coordinates are therefore not direct archaeological documentation.',confidence:'The general axis is supported; pylon form, height, and precise placement are INTERPRETIVE',type:'Gateway or pylon',material:'Sandstone or granite depending on the element',period:'Multiple periods',source:'Lange-Athinodorou 2022, Area A excavations; Naville 1891'},
  'Stone architrave, beam or lintel': {badge:'Structural Reconstruction',title:'Stone Beam or Lintel',description:'A digital structural element showing how loads pass from roof slabs to column capitals and walls. Stone roofing is architecturally probable, but exact dimensions and placement are interpretive.',confidence:'Probable architectural reconstruction',type:'Stone beam / lintel',material:'Heavy stone slabs or red granite depending on the hall',period:'Not precisely assigned to each digital element',source:'Conservative structural inference from the hall and column layout'},
  'Interpretive roof slab or star ceiling': {badge:'Roof Reconstruction',title:'Roof Slab or Interpretive Star Ceiling',description:'A roof element added to show the completed form of covered halls and the route of light. Its position, thickness, and completion are not direct archaeological records.',confidence:'Interpretive reconstruction',type:'Roof or stone slab',material:'Stone; symbolic coloring on the star ceiling',period:'According to the area',source:'Conservative architectural reconstruction'},
  'Interpretive ritual furnishing': {badge:'Interpretive Ritual Element',title:'Offering Table or Ritual Object',description:'An explanatory element helping visitors understand the function of sacred rooms. Offering rituals are attested in the reliefs, but this object’s form and present position are not archaeologically established.',confidence:'Explanatory; form and placement are interpretive',type:'Ritual furnishing or implement',material:'Interpretive stone or metal',period:'Not specified for the digital object',source:'Relief and ritual program of the Temple of Bastet'},
  'Relief scene or ritual register': {badge:'Relief from Tell Basta',title:'Relief Scene or Ceremonial Register',description:'The digital relief is based on published scenes from Tell Basta, especially the Heb-Sed program of Osorkon II. Some scenes are directly attested, while placement on a particular wall may be contextual or interpretive.',confidence:'Varies by object; consult the detailed relief data',type:'Three-dimensional relief',material:'Stone or red-granite surface with enhanced Relief depth',period:'Most of the program is associated with Osorkon II',source:'Naville 1892; British Museum EA1105 and objects from Tell Basta'},
  'Threshold, platform or processional axis': {badge:'Movement and Axis Element',title:'Threshold, Platform, or Processional Axis',description:'A detail showing movement between halls and along the central axis. Some dimensions and wear patterns were added for museum legibility and are not literal archaeological records.',confidence:'The general axis is probable; details are interpretive',type:'Threshold / platform / route',material:'Stone',period:'Multiple periods',source:'Archaeological plan and project reconstruction'},
  'Reconstructed temple wall': {badge:'Architectural Reconstruction',title:'Reconstructed Temple Wall',description:'The wall communicates hall boundaries and the ritual axis according to the reference plan. Full height, masonry detail, and state of preservation are interpretive.',confidence:'The general plan is probable; height and details are interpretive',type:'Stone wall',material:'Sandstone or mudbrick depending on the area',period:'Multiple periods',source:'Published archaeological plan and project reconstruction'},
  'Floor or museum-display surface detail': {badge:'Museum Display Detail',title:'Floor or Stone Surface Detail',description:'A visual detail improving the reading of floors and the central route by showing slab joints and light wear. It does not claim an attested paving pattern for every area.',confidence:'Interpretive display detail',type:'Stone floor',material:'Stone with visual dust',period:'Unassigned',source:'Project visual treatment'}
});

const DYNAMIC_INFO_EN = Object.freeze({
  'الصرح الشرقي — تمثيل تفسيري':{title:'Eastern Pylon — Interpretive Representation'},
  'علامة ارتباط بالدليل — ليست بقايا في موضعها':{title:'Evidence-Association Marker — Not an In-Situ Remain'},
  'تمثال باستت داخل المشكاة':{title:'Bastet Statue inside the Niche'},
  'قطة كاملة الجسد':{title:'Full-Bodied Cat'},'سيدة بجسد إنساني ورأس قطة':{title:'Woman with a Human Body and Cat Head'},'سيدة برأس لبؤة أو هيئة لبؤة':{title:'Lioness-Headed Woman or Lioness Form'},
  'ناووس نختنبو الثاني — نسخة V18':{title:'Nectanebo II Naos — V18'},
  'السقف النجمي المحفور':{title:'Engraved Star Ceiling'},'عتب مدخل معبد نختنبو الثاني':{title:'Nectanebo II Temple Entrance Lintel'},'تأثيث طقسي محدود':{title:'Limited Interpretive Ritual Furnishing'},
  'برنامج نقوش رأسي على القائمتين وأفقي على العتب':{title:'Vertical Jamb and Horizontal Lintel Inscription Program'},
  'فناء حتحوري مفتوح من أعلى — تنفيذ مباشر لملاحظة الدكتور':{title:'Open-Air Hathoric Courtyard — Implemented from the Review Note'},
  'لقب باستت على الجدار الشرقي':{badge:'Inscription Detail',title:'Title of Bastet on the Eastern Wall',description:'An interpretive site inscription including the textually attested title: “Bastet the Great, Lady of Per-Bastet…” The form and digital arrangement of the signs are probable.',confidence:'The text is ATTESTED; the visual arrangement is PROBABLE',type:'Inscription',material:'Granite/stone',period:'Not specified for the digital display',source:'Review note — eastern enclosure wall'},
  'مرسوم كانوب — نقطة معلومات':{badge:'Information Point — Interpretive Display Position',title:'Canopus Decree',description:'A fragment of the Canopus Decree was found in the entrance hall of the Temple of Bastet. It dates to Ptolemy III and the discovered fragment includes Demotic and Greek inscriptions. The model’s position in the tour is interpretive and does not represent an attested original position.',confidence:'INTERPRETIVE display position; entrance-hall find association ATTESTED',type:'Information Hotspot model',material:'Basalt fragment on a small explanatory plinth',period:'Ptolemy III',source:'Canopus Decree fragment from Bubastis'},
  'خوفو وخفرع':{badge:'Historical Evidence Note',title:'Khufu and Khafre',description:'The names of Khufu and Khafre were found, suggesting construction or activity at the temple from the Fourth Dynasty. The present pylon and halls are not attributed to them because the plan of that period is unknown.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Old Kingdom / multiple periods',source:'Review correction of royal attributions'},
  'بيبي الأول':{badge:'Historical Evidence Note',title:'Pepi I',description:'Sources indicate that Pepi I built a temple honoring Bastet, but it is not automatically placed within the digital sequence of elements 23–30, and no hall is attributed to him without evidence.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Sixth Dynasty',source:'Review correction of royal attributions'},
  'أمنمحات الأول':{badge:'Historical Evidence Note',title:'Amenemhat I',description:'Amenemhat I built a gateway for Bastet. An inscribed support was found within the Nectanebo II temple and may have been reused, so it does not establish a specific original position in the model.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Twelfth Dynasty',source:'Review correction of royal attributions'},
  'أمنمحات الثالث':{badge:'Historical Evidence Note',title:'Amenemhat III',description:'Amenemhat III built a mudbrick residence or palace at Tell Basta. It is not certain that it formed part of the great temple, so it is not integrated into the sequence of temple rooms.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Twelfth Dynasty',source:'Review correction of royal attributions'},
  'رمسيس الثاني':{badge:'Historical Evidence Note',title:'Ramesses II',description:'Statues and remains bearing the name of Ramesses II were found, including a pink-granite statue between Ptah and Bastet. Some of his monuments were reused under Osorkon II. A complete hall is not attributed to him without an independent source.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Nineteenth Dynasty',source:'Review correction of royal attributions'},
  'قاعدة النسبة التاريخية':{badge:'Historical Method',title:'Rule for Historical Attribution',description:'Textual evidence and reused objects are separated from later architectural planning. Finding a king’s name does not prove that he built the digital space in which the information is displayed.',confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Historical Hotspot',material:'Interpretive stone display panel',period:'Multiple periods',source:'Review correction of royal attributions'}
});

const COLUMN_INFO_EN = Object.freeze({
  palmiform_ea1065:{title:'Red-Granite Palmiform Column — EA1065',type:'Palmiform monolithic column',date:'c. 1250 BCE; parts recut in the Twenty-Second Dynasty',rulers:'Ramesses II; partially recut for Osorkon II',material:'Red granite',dimensions:'Published maximum height: 6.32 m',confidence:'High for type, material, and height; medium for reconstructed base and capital details',source:'British Museum EA1065; Temple of Bastet at Tell Basta',note:'Palm-leaf form and internal proportions are conservatively reconstructed; inscriptions are not presented as literal hieroglyphic copies.'},
  papyrus_bundle:{title:'Papyrus-Bundle Column',type:'Papyrus bundle column',date:'Twenty-Second Dynasty in the western section of the temple',rulers:'Associated with Osorkon II expansions according to the site description',material:'Stone or granite depending on the hall; the current material is interpretive',dimensions:'Full height and diameter are estimated within the model',confidence:'High for the presence of the type; medium to low for exact proportions and capital form at each position',source:'Egyptian Ministry of Tourism and Antiquities; Naville plan and publication',note:'A closed-bud capital is used conservatively where the evidence does not identify every capital form.'},
  hathor_ea1107:{title:'Hathoric Papyrus-Bundle Column — Based on EA1107',type:'Papyrus-bundle shaft with bifacial Hathor capital',date:'Twenty-Second Dynasty',rulers:'Probably made under Osorkon I and erected or usurped under Osorkon II',material:'Red granite',dimensions:'Preserved capital: 1.95 m high × 0.80 m wide × 0.84 m deep; full column height is estimated',confidence:'High for preserved dimensions and the two principal faces; medium for the complete column and missing upper parts',source:'British Museum EA1107; Tell Basta',note:'The capital is bifacial on its two principal surfaces, not four-faced. Northern symbols appear only on the attested north-side version.'},
  simple:{title:'Simple Stone Column — Probable Reconstruction',type:'Simple stone column',date:'Osorkon II; placement and proportions are probable',rulers:'The hall is not attributed to another king without evidence',material:'Stone',confidence:'PROBABLE — simplified type pending a direct reference',source:'Review note: halls 27 and 28 use simpler stone columns',note:'This column does not represent a specific archaeological object.'}
});

function readStoredLanguage(){
  try{
    const queryLanguage=new URLSearchParams(window.location.search).get('lang');
    if(['ar','en'].includes(queryLanguage))return queryLanguage;
    for(const key of['bastet_lang','bastet_tour_lang','bastet-language']){
      const value=localStorage.getItem(key);if(['ar','en'].includes(value))return value;
    }
  }catch{}
  return 'ar';
}
function storeLanguage(language){try{for(const key of['bastet_lang','bastet_tour_lang','bastet-language'])localStorage.setItem(key,language);}catch{}}
function notifyParent(type,payload={}){if(window.parent===window)return;try{window.parent.postMessage({type,...payload},window.location.origin);}catch{}}
let currentLanguage=readStoredLanguage();storeLanguage(currentLanguage);
let currentInfoPayload=null;
function t(key,vars={}){let value=(I18N[currentLanguage]&&I18N[currentLanguage][key])??I18N.ar[key]??key;for(const[k,v]of Object.entries(vars))value=value.replaceAll(`{${k}}`,String(v));return value;}
function localizeRecord(record={}){
  if(currentLanguage!=='en')return record;
  const english={...(OBJECT_INFO_EN[record.englishTitle]||DYNAMIC_INFO_EN[record.title]||{}),...(record.en||{})};
  return {...record,...english,englishTitle:''};
}
function applyStaticTranslations(){
  document.documentElement.lang=currentLanguage;document.documentElement.dir=currentLanguage==='ar'?'rtl':'ltr';
  document.querySelectorAll('[data-i18n]').forEach((el)=>{el.textContent=t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-html]').forEach((el)=>{el.innerHTML=t(el.dataset.i18nHtml);});
  document.querySelectorAll('[data-i18n-aria]').forEach((el)=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
  document.querySelectorAll('[data-i18n-alt]').forEach((el)=>el.setAttribute('alt',t(el.dataset.i18nAlt)));
  document.querySelectorAll('[data-i18n-content]').forEach((el)=>el.setAttribute('content',t(el.dataset.i18nContent)));
  document.title=t('meta.title');
  const button=document.getElementById('language-toggle-btn');if(button){button.textContent=t('language.button');button.setAttribute('aria-label',t('language.aria'));button.setAttribute('title',t('language.aria'));}
  updateAudioButton();
  if(currentInfoPayload&&document.getElementById('info-panel')?.classList.contains('open')&&typeof renderInfo==='function')renderInfo(currentInfoPayload);
  const hover=document.getElementById('hover-label');if(hover)hover.classList.add('hidden');
  document.documentElement.dataset.language=currentLanguage;
}
function setLanguage(language){
  const nextLanguage=language==='en'?'en':'ar';
  if(nextLanguage===currentLanguage){storeLanguage(currentLanguage);applyStaticTranslations();return;}
  currentLanguage=nextLanguage;
  storeLanguage(currentLanguage);
  resetNarrationForLanguage();
  applyStaticTranslations();
  window.dispatchEvent(new CustomEvent('bastet:language-changed',{detail:{language:currentLanguage}}));
  notifyParent('LANGUAGE_CHANGED',{language:currentLanguage});
}

const UI_QA_MODE = new URLSearchParams(window.location.search).has('qa-ui');

const MODEL_DIMENSIONS = await fetch(new URL('./model-dimensions-v18.json', import.meta.url)).then((response) => {
  if (!response.ok) throw new Error(`Unable to load shared model dimensions: ${response.status}`);
  return response.json();
});

const wrap = document.getElementById('canvas-wrap');
const loading = document.getElementById('loading');
const loadingDetail = document.getElementById('loading-detail');
const narrationAudio=document.getElementById('narration-audio');
const audioToggleBtn=document.getElementById('audio-toggle-btn');
const AUDIO_TRACKS=Object.freeze({
  ar:new URL('./assets/audio/bastet-tour-ar.mp3',import.meta.url).href,
  en:new URL('./assets/audio/bastet-tour-en.mp3',import.meta.url).href,
});
let narrationLanguage=null;
let narrationPlayRequested=false;

function isNarrationPlaying(){return Boolean(narrationAudio&&!narrationAudio.paused&&!narrationAudio.ended);}
function updateAudioButton(){
  if(!audioToggleBtn)return;
  const playing=isNarrationPlaying()||narrationPlayRequested;
  audioToggleBtn.textContent=t(playing?'audio.pause':'audio.play');
  audioToggleBtn.setAttribute('aria-label',t(playing?'audio.ariaPause':'audio.ariaPlay'));
  audioToggleBtn.setAttribute('title',t(playing?'audio.ariaPause':'audio.ariaPlay'));
  audioToggleBtn.setAttribute('aria-pressed',playing?'true':'false');
  audioToggleBtn.classList.toggle('is-playing',playing);
  audioToggleBtn.dataset.audioLanguage=currentLanguage;
}
function loadNarrationForLanguage(language=currentLanguage){
  if(!narrationAudio)return;
  const normalized=language==='en'?'en':'ar';
  const expected=AUDIO_TRACKS[normalized];
  if(narrationLanguage===normalized&&narrationAudio.src===expected)return;
  narrationAudio.pause();
  narrationPlayRequested=false;
  narrationAudio.src=expected;
  narrationAudio.load();
  narrationLanguage=normalized;
  document.documentElement.dataset.audioLanguage=normalized;
  updateAudioButton();
}
function resetNarrationForLanguage(){
  if(!narrationAudio)return;
  narrationAudio.pause();
  narrationPlayRequested=false;
  try{narrationAudio.currentTime=0;}catch{}
  narrationLanguage=null;
  loadNarrationForLanguage(currentLanguage);
}
async function toggleNarration(){
  if(!narrationAudio)return;
  loadNarrationForLanguage(currentLanguage);
  if(isNarrationPlaying()||narrationPlayRequested){
    narrationAudio.pause();
    narrationPlayRequested=false;
    updateAudioButton();
    return;
  }
  if(narrationAudio.ended){try{narrationAudio.currentTime=0;}catch{}}
  narrationPlayRequested=true;
  updateAudioButton();
  try{
    await narrationAudio.play();
  }catch(error){
    narrationPlayRequested=false;
    updateAudioButton();
    console.error(t('audio.error'),error);
  }
}

loadNarrationForLanguage(currentLanguage);
applyStaticTranslations();
document.getElementById('language-toggle-btn')?.addEventListener('click',()=>setLanguage(currentLanguage==='ar'?'en':'ar'));
document.getElementById('home-link')?.addEventListener('click',()=>{if(window.parent!==window)notifyParent('EXIT_TOUR');else window.location.href='../#/';});
audioToggleBtn?.addEventListener('click',toggleNarration);
for(const eventName of['play','pause','ended','canplay','error'])narrationAudio?.addEventListener(eventName,()=>{narrationPlayRequested=false;updateAudioButton();});

function createUiQaRenderer(){
  const canvas=document.createElement('canvas');
  canvas.dataset.uiQaCanvas='true';
  let pixelRatio=1;
  return {
    domElement:canvas,shadowMap:{enabled:false,type:null},outputColorSpace:null,toneMapping:null,toneMappingExposure:1,
    capabilities:{getMaxAnisotropy:()=>1},setPixelRatio:(value)=>{pixelRatio=value;},getPixelRatio:()=>pixelRatio,
    setSize:()=>{},render:()=>{}
  };
}
const renderer = UI_QA_MODE ? createUiQaRenderer() : new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
wrap.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb9ad96);
scene.fog = new THREE.FogExp2(0xb9ad96, 0.00142);

const camera = new THREE.PerspectiveCamera(47, window.innerWidth / window.innerHeight, 0.1, 1500);
camera.position.set(132, 104, 188);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.07;
controls.target.set(0, 7, 18);
controls.minDistance = 18;
controls.maxDistance = 360;
controls.maxPolarAngle = Math.PI * 0.495;

scene.add(new THREE.HemisphereLight(0xfff4df, 0x5b625f, 1.62));
const sun = new THREE.DirectionalLight(0xffdfa8, 3.62);
sun.position.set(-185, 340, 235);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
sun.shadow.camera.left = -320;
sun.shadow.camera.right = 320;
sun.shadow.camera.top = 340;
sun.shadow.camera.bottom = -340;
sun.shadow.camera.near = 35;
sun.shadow.camera.far = 850;
sun.shadow.bias = -0.00008;
sun.shadow.normalBias = 0.04;
sun.shadow.radius = 4.0;
scene.add(sun);
const fill = new THREE.DirectionalLight(0xdce8e5, 1.05);
fill.position.set(240, 145, -250);
scene.add(fill);
const rim = new THREE.DirectionalLight(0xffedcf, .48);
rim.position.set(-210, 95, -210);
scene.add(rim);
const sanctuaryGlow = new THREE.PointLight(0xffb56b, .24, 18, 2);
sanctuaryGlow.position.set(2.35, 3.75, -67.4);
scene.add(sanctuaryGlow);
const cultFocusGlow = new THREE.PointLight(0xffc07a, .94, 9, 2);
cultFocusGlow.position.set(0, 2.35, -68.65);
cultFocusGlow.userData = { kelvin:3100, role:'subtle interpretive focus on the Bastet niche; not an ancient fixture' };
scene.add(cultFocusGlow);
const naosKeyLight = new THREE.SpotLight(0xffd2a0, .90, 17, Math.PI*.27, .80, 2);
naosKeyLight.position.set(-2.35, 4.05, -63.35);
naosKeyLight.target.position.set(0, 2.18, MODEL_DIMENSIONS.naos.centerZ);
scene.add(naosKeyLight, naosKeyLight.target);
const starCeilingFill = new THREE.SpotLight(0xffd2a0, 1.52, 13, Math.PI*.48, .88, 2);
starCeilingFill.position.set(0,5.55,-65.7);starCeilingFill.target.position.set(0,8.48,-69.1);
starCeilingFill.userData={role:'runtime-only grazing fill for the engraved star ceiling; not an ancient fixture'};
scene.add(starCeilingFill,starCeilingFill.target);
const sideChamberFillLights=[[-6.2,-65.3],[6.2,-68.3]].map(([x,z])=>{
  const light=new THREE.PointLight(0xffbc7a,.32,9,2);light.position.set(x,3.1,z);light.userData={role:'runtime-only side-chamber legibility fill; not an ancient fixture'};scene.add(light);return light;
});

const interiorLightGroup = new THREE.Group();
interiorLightGroup.name = 'Progressive_Interior_Lighting_V18_Doctor_Final';
for (const [z, color, intensity, distance, kelvin] of [
  [82,0xffd7ad,.34,34,4200],[57,0xffd3a5,.27,30,4000],[26,0xffcc98,.23,29,3800],
  [-1,0xffc58b,.16,23,3500],[-16,0xffbf80,.12,21,3300],[-32,0xffd4a4,.30,26,4100],[-47,0xffb978,.09,16,3000],[-56,0xffad63,.065,14,2850],[-69,0xffa85d,.045,12,2700],
]) {
  const light = new THREE.PointLight(color, intensity, distance, 2);
  light.position.set(0, 5.8, z);
  light.castShadow = false;
  light.userData = { kelvin, role:'subtle architectural fill; not a reconstructed ancient fixture' };
  interiorLightGroup.add(light);
}
scene.add(interiorLightGroup);

function makeStoneTexture({ base = '#c7a875', mortar = '#7f6846', noise = 20, blocks = true, seed = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, c.width, c.height);
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const img = ctx.getImageData(0, 0, c.width, c.height);
  const data = img.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (rand() - 0.5) * noise;
    data[i] = THREE.MathUtils.clamp(data[i] + n, 0, 255);
    data[i + 1] = THREE.MathUtils.clamp(data[i + 1] + n, 0, 255);
    data[i + 2] = THREE.MathUtils.clamp(data[i + 2] + n, 0, 255);
  }
  ctx.putImageData(img, 0, 0);
  // Broad mineral variation reduces obvious texture tiling in close views.
  ctx.save();
  for (let i = 0; i < 52; i++) {
    const x = rand() * c.width, y = rand() * c.height;
    const r = 28 + rand() * 125;
    ctx.globalAlpha = .012 + rand() * .024;
    ctx.fillStyle = rand() > .5 ? '#fff1cf' : '#5e4631';
    ctx.beginPath(); ctx.ellipse(x, y, r, r * (.35 + rand() * .7), rand() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  if (blocks) {
    ctx.strokeStyle = mortar;
    ctx.globalAlpha = 0.28;
    ctx.lineWidth = 3;
    const rowH = 80;
    const blockW = 126;
    for (let y = 0; y <= 1024; y += rowH) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1024, y); ctx.stroke();
      const offset = ((y / rowH) % 2) * blockW * 0.5;
      for (let x = -offset; x <= 1024; x += blockW) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + rowH); ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 12);
  return t;
}


function makeGraniteTexture(seed = 14) {
  const size = 1024;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#a6655e'; ctx.fillRect(0, 0, size, size);
  let state = seed >>> 0;
  const rand = () => ((state = (state * 1664525 + 1013904223) >>> 0) / 4294967296);
  const grains = [
    ['#d6a392', 1.1, 3.8, .62],
    ['#6b514c', .7, 2.7, .58],
    ['#302e2d', .35, 1.65, .50],
    ['#d6c2ab', .4, 2.2, .40],
  ];
  for (let n = 0; n < 17000; n++) {
    const [color, minR, maxR, alpha] = grains[Math.floor(rand() * grains.length)];
    const x = rand() * size, y = rand() * size;
    const rx = minR + rand() * (maxR - minR);
    const ry = rx * (.45 + rand() * .9);
    ctx.globalAlpha = alpha * (.45 + rand() * .55);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rand() * Math.PI, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 12);
  return t;
}

function makeStoneNormal(seed = 1) {
  const size = 512;
  const c = document.createElement('canvas'); c.width = c.height = size;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(size, size);
  let s = seed >>> 0;
  const rand = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      const n = (rand() - 0.5) * 20;
      img.data[i] = 128 + n;
      img.data[i + 1] = 128 + n;
      img.data[i + 2] = 245;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  return t;
}

const sandstoneMap = makeStoneTexture({ base: '#C9B08A', mortar: '#806b4e', noise: 17, seed: 11 });
const limestoneMap = makeStoneTexture({ base: '#d4c19d', mortar: '#9a8768', noise: 13, seed: 12 });
const mudbrickMap = makeStoneTexture({ base: '#8A6548', mortar: '#5b422f', noise: 24, seed: 13 });
const graniteMap = makeGraniteTexture(14);
const darkGraniteMap = makeStoneTexture({ base: '#51423e', mortar: '#292421', noise: 18, blocks: false, seed: 15 });
const stoneNormal = makeStoneNormal(77);
for (const t of [sandstoneMap, limestoneMap, mudbrickMap, graniteMap, darkGraniteMap, stoneNormal]) t.repeat.set(3, 3);

const materials = {
  sandstone: new THREE.MeshStandardMaterial({ map: sandstoneMap, normalMap: stoneNormal, normalScale: new THREE.Vector2(.30, .30), roughness: .80, metalness: 0, color: 0xC9B08A }),
  limestone: new THREE.MeshStandardMaterial({ map: limestoneMap, normalMap: stoneNormal, normalScale: new THREE.Vector2(.24, .24), roughness: .84, metalness: 0, color: 0xDDC9A5 }),
  mudbrick: new THREE.MeshStandardMaterial({ map: mudbrickMap, normalMap: stoneNormal, normalScale: new THREE.Vector2(.32, .32), roughness: 1, metalness: 0, color: 0x8A6548 }),
  granite: new THREE.MeshStandardMaterial({ map: graniteMap, normalMap: stoneNormal, normalScale: new THREE.Vector2(.28, .28), roughness: .54, metalness: 0, color: 0xA96559 }),
  darkStone: new THREE.MeshStandardMaterial({ map: darkGraniteMap, normalMap: stoneNormal, normalScale: new THREE.Vector2(.20,.20), roughness: .88, metalness: 0, color: 0x242221 }),
  paintedBlue: new THREE.MeshStandardMaterial({ color: 0x1F6078, roughness: .80, transparent:true, opacity:.42 }),
  paintedGreen: new THREE.MeshStandardMaterial({ color: 0x338B86, roughness: .82, transparent:true, opacity:.38 }),
  paintedRed: new THREE.MeshStandardMaterial({ color: 0x8f4439, roughness: .77 }),
  pigmentGold: new THREE.MeshStandardMaterial({ color: 0xb7964f, roughness: .68, metalness: .03, transparent:true, opacity:.46 }),
  bronze: new THREE.MeshStandardMaterial({ color: 0x65502f, roughness: .48, metalness: .62 }),
  shadow: new THREE.MeshStandardMaterial({ color: 0x292521, roughness: .92 }),
};
materials.sandstoneWarm = materials.sandstone.clone();
materials.sandstoneWarm.name = 'Warm_Aged_Sandstone_V18';
materials.sandstoneWarm.color.set(0xbfa076);
materials.sandstoneWarm.roughness = .90;
materials.sandstoneWarm.normalScale.set(.42,.42);
materials.sandstoneAged = materials.sandstone.clone();
materials.sandstoneAged.name = 'Deep_Aged_Sandstone_V18';
materials.sandstoneAged.color.set(0xaa8963);
materials.sandstoneAged.roughness = .94;
materials.sandstoneAged.normalScale.set(.50,.50);
materials.limestoneAged = materials.limestone.clone();
materials.limestoneAged.name = 'Aged_Limestone_V18';
materials.limestoneAged.color.set(0xcbb58d);
materials.limestoneAged.roughness = .93;
materials.limestoneAged.normalScale.set(.38,.38);
materials.graniteDark = materials.granite.clone();
materials.graniteDark.name = 'Dark_Red_Granite_V18';
materials.graniteDark.color.set(0x76504b);
materials.graniteDark.roughness = .66;
materials.graniteDark.normalScale.set(.38,.38);
materials.floorPatina = new THREE.MeshStandardMaterial({ color:0x6d5840, roughness:1, transparent:true, opacity:.16, depthWrite:false });
materials.crack = new THREE.MeshStandardMaterial({ color:0x3c3027, roughness:1, transparent:true, opacity:.72, depthWrite:false });

materials.roofLimestone = materials.limestone.clone();
materials.roofLimestone.name = 'Roof_Limestone_V18';
materials.roofLimestone.emissive = new THREE.Color(0x000000);
materials.roofLimestone.emissiveIntensity = 0;
materials.roofLimestone.side = THREE.DoubleSide;
materials.roofSandstone = materials.sandstone.clone();
materials.roofSandstone.name = 'Roof_Sandstone_V18';
materials.roofSandstone.emissive = new THREE.Color(0x000000);
materials.roofSandstone.emissiveIntensity = 0;
materials.roofSandstone.side = THREE.DoubleSide;
materials.roofGranite = materials.granite.clone();
materials.roofGranite.name = 'Roof_Granite_V18';
materials.roofGranite.emissive = new THREE.Color(0x000000);
materials.roofGranite.emissiveIntensity = 0;
materials.roofGranite.side = THREE.DoubleSide;
materials.floorJoint = new THREE.MeshStandardMaterial({ color:0x6f5a3f, roughness:1, transparent:true, opacity:.55 });
materials.dust = new THREE.MeshStandardMaterial({ color:0xb59b6d, roughness:1, transparent:true, opacity:.28, depthWrite:false });
materials.edgeWear = new THREE.MeshStandardMaterial({ color:0xc8b58c, roughness:.98, transparent:true, opacity:.20, depthWrite:false });

const TEMPLE_AXIS_X = 0;
const METERS_TO_UNITS = 1;
// V18 doctor-final plan: the dimensions below are authored directly in metres.
// Zones 24–25 share a 48 × 24 m envelope; zone 26 is 39 × 24 m;
// zones 27–28 share a 30 × 14 m envelope. Other dimensions are conservative
// probable reconstructions and are labelled accordingly in the metadata.
const PLAN = Object.freeze({
  eastEnclosureZ: 118,
  pylonZ: 108,
  palmColumnsZ: 98,
  zone24EastZ: 94,
  zone24_25DividerZ: 70,
  zone25WestZ: 46,
  zone26WestZ: 7,
  zone27_28DividerZ: -8,
  zone28WestZ: -23,
  zone29WestZ: -41,
  zone30WestZ: -77,
  westEnclosureZ: -82,
  osorkonWidth: 24,
  hebSedWidth: 24,
  mainHallWidth: 14,
  hathorWidth: 14,
  nectaneboWidth: 20,
  wallThickness: 1.8,
});
const CERTAINTY = Object.freeze({ ATTESTED:'ATTESTED', PROBABLE:'PROBABLE', INTERPRETIVE:'INTERPRETIVE' });

const templeModel = new THREE.Group();
templeModel.name = 'Bastet_Temple_Bubastis_V18_Doctor_Final';
templeModel.userData = {
  version:'V18.0',
  scale:'1 unit = 1 working metre',
  axis:'east-west on Z; central axis X=0',
  archaeologicalScope:'Broad axial sequence is evidence-based; exact internal geometry and furnishing positions are reconstructed unless explicitly stated otherwise.',
  audit:'Doctor-requested visual reconstruction. See V18_IMPLEMENTATION_REPORT_AR.md'
};
scene.add(templeModel);
const existingRuinsGroup = new THREE.Group(); existingRuinsGroup.name = 'Evidence_Association_Markers_Not_InSitu'; templeModel.add(existingRuinsGroup);
const reconstructedTempleGroup = new THREE.Group(); reconstructedTempleGroup.name = 'Reconstructed_Temple'; templeModel.add(reconstructedTempleGroup);
const probableReconstructionGroup = new THREE.Group(); probableReconstructionGroup.name = 'Probable_Reconstruction'; reconstructedTempleGroup.add(probableReconstructionGroup);
const interpretiveAdditionsGroup = new THREE.Group(); interpretiveAdditionsGroup.name = 'Interpretive_Additions'; reconstructedTempleGroup.add(interpretiveAdditionsGroup);
const pigmentTracesGroup = new THREE.Group(); pigmentTracesGroup.name = 'Pigment_Traces_Optional'; reconstructedTempleGroup.add(pigmentTracesGroup);
const architectureGroup = new THREE.Group(); architectureGroup.name = 'Architecture_V18'; probableReconstructionGroup.add(architectureGroup);
const columnsGroup = new THREE.Group(); columnsGroup.name = 'Distinct_Columns_V18'; probableReconstructionGroup.add(columnsGroup);
const reliefsGroup = new THREE.Group(); reliefsGroup.name = 'Reliefs_Deepened_And_Reoriented_V18'; probableReconstructionGroup.add(reliefsGroup);
const ritualGroup = new THREE.Group(); ritualGroup.name = 'Interpretive_Ritual_Elements_V18'; interpretiveAdditionsGroup.add(ritualGroup);
const roofsGroup = new THREE.Group(); roofsGroup.name = 'Heavy_Stone_Roofs_V18'; probableReconstructionGroup.add(roofsGroup);
const v6Group = new THREE.Group(); v6Group.name = 'V18_Gates_And_Sanctuary'; probableReconstructionGroup.add(v6Group);
const museumDetailGroup = new THREE.Group(); museumDetailGroup.name = 'V18_Weathering_And_Floor_Details'; interpretiveAdditionsGroup.add(museumDetailGroup);
const environment = new THREE.Group(); environment.name = 'Environment_Not_In_GLB'; scene.add(environment);
const markersGroup = new THREE.Group(); scene.add(markersGroup);
const markerSuppressionReasons=new Set();
const allowedMarkerSuppressionReasons=new Set(['guided-tour','presentation','screenshot','capture']);
let markerVisibilityBeforeSuppression=null;
function setMarkersSuppressed(reason,active){
  if(!allowedMarkerSuppressionReasons.has(reason)) throw new Error(`Unsupported marker suppression reason: ${reason}`);
  if(active){
    if(markerSuppressionReasons.has(reason))return;
    if(markerSuppressionReasons.size===0)markerVisibilityBeforeSuppression=markersGroup.visible;
    markerSuppressionReasons.add(reason);markersGroup.visible=false;document.documentElement.dataset.markerState=JSON.stringify({visible:false,reasons:[...markerSuppressionReasons]});return;
  }
  markerSuppressionReasons.delete(reason);
  if(markerSuppressionReasons.size){markersGroup.visible=false;document.documentElement.dataset.markerState=JSON.stringify({visible:false,reasons:[...markerSuppressionReasons]});return;}
  if(markerVisibilityBeforeSuppression!==null)markersGroup.visible=markerVisibilityBeforeSuppression;
  markerVisibilityBeforeSuppression=null;
  document.documentElement.dataset.markerState=JSON.stringify({visible:markersGroup.visible,reasons:[]});
}
function setCaptureMode(active){setMarkersSuppressed('capture',Boolean(active));document.body.classList.toggle('capture-mode',Boolean(active));}

const interactiveReliefs = [];
const interactiveColumns = [];
const interactiveV18Objects = [];
const reliefMaterials = [];
const textureCache = new Map();
const imageCache = new Map();
const assetById = new Map(RELIEF_ASSETS.map((a) => [a.id, a]));

function shadow(mesh) { mesh.castShadow = true; mesh.receiveShadow = true; return mesh; }
function box(w, h, d, material, x, y, z, group = architectureGroup, name = '') {
  const mesh = shadow(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material));
  mesh.position.set(x, y, z); mesh.name = name; group.add(mesh); return mesh;
}
function roundedBox(w, h, d, radius, material, x, y, z, group = architectureGroup, name = '') {
  const g = new RoundedBoxGeometry(w, h, d, 2, radius);
  const mesh = shadow(new THREE.Mesh(g, material));
  mesh.position.set(x, y, z); mesh.name = name; group.add(mesh); return mesh;
}
function taperedBox(w, h, d, taper = .78, material = materials.sandstone) {
  const bw = w / 2, bd = d / 2, tw = bw * taper, td = bd * taper;
  const y0 = -h / 2, y1 = h / 2;
  const p = [-bw,y0,-bd, bw,y0,-bd, bw,y0,bd, -bw,y0,bd, -tw,y1,-td, tw,y1,-td, tw,y1,td, -tw,y1,td];
  const idx = [0,1,2,0,2,3,4,6,5,4,7,6,0,4,5,0,5,1,1,5,6,1,6,2,2,6,7,2,7,3,3,7,4,3,4,0];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals();
  return shadow(new THREE.Mesh(g, material));
}
function wallSegment(x, z, w, d, h = 7, mat = materials.sandstone, group = architectureGroup) { return box(w, h, d, mat, x, h / 2, z, group); }
function createCavettoCornice(width, depth, radius, material, x, y, z, group, name) {
  const geom = new THREE.CylinderGeometry(radius, radius, width, 28, 1, false, 0, Math.PI * .56);
  const mesh = shadow(new THREE.Mesh(geom, material));
  mesh.rotation.z = Math.PI / 2;
  mesh.rotation.y = Math.PI;
  mesh.position.set(x, y, z);
  mesh.name = name;
  group.add(mesh);
  return mesh;
}
function createEgyptianPortal({
  name='Egyptian_Portal', archaeologicalId=null, x=TEMPLE_AXIS_X, z, wallWidth, wallHeight=8, wallThickness=PLAN.wallThickness,
  openingWidth=6, openingHeight=null, recessDepth=1.15, material=materials.sandstone,
  corniceStyle='cavetto', decorationLevel='standard', certainty=CERTAINTY.PROBABLE, group=architectureGroup
} = {}) {
  if (!Number.isFinite(z) || !Number.isFinite(wallWidth) || wallWidth <= openingWidth + 1.2) throw new Error(`Invalid portal dimensions for ${name}`);
  const g = new THREE.Group(); g.name = name;
  const clearHeight = openingHeight ?? Math.max(4.4, wallHeight - 1.5);
  const sideWidth = (wallWidth - openingWidth) / 2;
  wallSegment(x - (openingWidth / 2 + sideWidth / 2), z, sideWidth, wallThickness, wallHeight, material, g).name = `${name}_Wall_Left`;
  wallSegment(x + (openingWidth / 2 + sideWidth / 2), z, sideWidth, wallThickness, wallHeight, material, g).name = `${name}_Wall_Right`;
  const jambWidth = Math.min(1.15, Math.max(.68, wallThickness * .46));
  const innerOffset = -Math.min(recessDepth * .52, wallThickness * .44);
  for (const sx of [-1,1]) {
    roundedBox(jambWidth, clearHeight, wallThickness + recessDepth, .10, material, x + sx * (openingWidth/2 + jambWidth/2), clearHeight/2, z, g, `${name}_Outer_Jamb_${sx<0?'Left':'Right'}`);
    roundedBox(jambWidth*.72, clearHeight*.93, wallThickness*.62, .08, material, x + sx * (openingWidth/2 - jambWidth*.08), clearHeight*.465, z + innerOffset, g, `${name}_Inner_Jamb_${sx<0?'Left':'Right'}`);
  }
  roundedBox(openingWidth + jambWidth*2, Math.max(.82, wallHeight-clearHeight+.62), wallThickness + recessDepth, .10, material, x, clearHeight + (wallHeight-clearHeight)/2, z, g, `${name}_Lintel`);
  roundedBox(openingWidth*.96, .24, wallThickness + recessDepth*.65, .06, material, x, .12, z + innerOffset*.55, g, `${name}_Threshold`);
  if (corniceStyle !== 'none') {
    createCavettoCornice(openingWidth + jambWidth*3.25, wallThickness + recessDepth + .24, .58, material, x, wallHeight+.38, z, g, `${name}_Cavetto_Cornice`);
    roundedBox(openingWidth + jambWidth*3.0, .24, wallThickness + recessDepth + .30, .08, material, x, wallHeight-.02, z, g, `${name}_Torus_Band`);
  }
  if (decorationLevel === 'rich') {
    const band=roundedBox(openingWidth + jambWidth*1.35, .34, wallThickness + recessDepth + .34, .05, materials.granite, x, clearHeight+.28, z, g, `${name}_Inscription_Band`);
    band.userData.pigmentTarget=true;
  }
  g.userData={ category:'architecture', archaeologicalId, certainty, title:name.replaceAll('_',' '), sourceRefs:[], recessedDoorway:true, axisX:TEMPLE_AXIS_X };
  group.add(g);
  return { group:g, meshes:g.children.filter(o=>o.isMesh), colliders:g.children.filter(o=>o.isMesh), hotspotAnchor:new THREE.Vector3(x,clearHeight*.55,z+wallThickness*.8), cameraStop:new THREE.Vector3(x,2.4,z+7), metadata:g.userData };
}
function crossWall(z, width, { h = 8, t = PLAN.wallThickness, door = 6, mat = materials.sandstone, x = TEMPLE_AXIS_X, decorated = false, name=`Portal_${z}`, archaeologicalId=null, openingHeight=null, recessDepth=1.15, certainty=CERTAINTY.PROBABLE } = {}) {
  return createEgyptianPortal({ name, archaeologicalId, x, z, wallWidth:width, wallHeight:h, wallThickness:t, openingWidth:door, openingHeight, recessDepth, material:mat, decorationLevel:decorated?'rich':'none', certainty });
}
function addGatewayMoulding(z, door, h, mat, x = TEMPLE_AXIS_X) {
  return createEgyptianPortal({name:`Legacy_Moulding_Portal_${z}`,x,z,wallWidth:door+4,wallHeight:h,wallThickness:PLAN.wallThickness,openingWidth:door,material:mat,decorationLevel:'standard'});
}
function longWall(x, zCenter, length, { h = 7, t = PLAN.wallThickness, mat = materials.sandstone, group=architectureGroup } = {}) { return wallSegment(x, zCenter, t, length, h, mat, group); }
function zoneSideWalls(width, eastZ, westZ, {h=7.4,t=PLAN.wallThickness,mat=materials.sandstone,group=architectureGroup,prefix='Zone'}={}) {
  const length=Math.abs(eastZ-westZ), center=(eastZ+westZ)/2, x=width/2-t/2;
  const left=longWall(-x,center,length,{h,t,mat,group});left.name=`${prefix}_North_Wall`;
  const right=longWall(x,center,length,{h,t,mat,group});right.name=`${prefix}_South_Wall`;
  return [left,right];
}

function sideWallWithDoor(x, eastZ, westZ, doorZ, doorWidth, {h=6.8,t=1.7,mat=materials.sandstoneAged,prefix='SideChamber'}={}) {
  const eastLength = Math.max(.4, eastZ - (doorZ + doorWidth/2));
  const westLength = Math.max(.4, (doorZ - doorWidth/2) - westZ);
  const east = longWall(x, (eastZ + doorZ + doorWidth/2)/2, eastLength, {h,t,mat}); east.name=`${prefix}_East_Segment`;
  const west = longWall(x, (doorZ - doorWidth/2 + westZ)/2, westLength, {h,t,mat}); west.name=`${prefix}_West_Segment`;
  roundedBox(t+.62,.34,doorWidth+.36,.07,materials.graniteDark,x,.17,doorZ,v6Group,`${prefix}_Threshold`);
  roundedBox(t+.70,.66,doorWidth+.48,.08,materials.graniteDark,x,h-.33,doorZ,v6Group,`${prefix}_Lintel`);
  return [east,west];
}
function addColumnAgeMarks(group,{h=7,r=.5,seed=1,type='stone'}={}) {
  let state=(Math.abs(Math.round(seed*1009))||1)>>>0;
  const rand=()=>((state=(state*1664525+1013904223)>>>0)/4294967296);
  group.scale.x*=.98+rand()*.04; group.scale.z*=.98+rand()*.04; group.rotation.y+=(rand()-.5)*.05;
  const markCount=type==='hathor'?3:4;
  for(let i=0;i<markCount;i++){
    const mark=roundedBox(.025+r*.042,.26+rand()*.34,.025+r*.042,.010,materials.crack,(rand()>.5?1:-1)*r*(.74+rand()*.12),h*(.20+rand()*.58),(rand()-.5)*r*.68,group,`Age_Crack_${type}_${i}`);
    mark.rotation.z=(rand()-.5)*.52;
    mark.userData.excludeFromCollision=true;
  }
  group.userData.weathering='V18 subtle non-identical wear and hairline cracking';
}
function createPortalInscriptionProgram({name,z,openingWidth,wallHeight,face='z-',material=materials.darkStone,archaeologicalId=null}={}) {
  const g=new THREE.Group(); g.name=`${name}_Directional_Inscription_Program_V18`;
  const faceOffset=face==='z-'?-.02:.02;
  const sideX=openingWidth/2+.82;
  for(const sx of[-1,1]) for(let row=0;row<9;row++){
    const glyph=roundedBox(.22+(row%3)*.035,.31+(row%2)*.04,.045,.012,material,sx*sideX,1.35+row*.48,z+faceOffset,g,`${name}_Vertical_Jamb_Glyph_${sx}_${row}`);
    glyph.userData.orientation='VERTICAL_JAMB';
  }
  for(let col=0;col<11;col++){
    const glyph=roundedBox(.25+(col%2)*.04,.28,.045,.012,material,-2.45+col*.49,wallHeight-.84,z+faceOffset,g,`${name}_Horizontal_Lintel_Glyph_${col}`);
    glyph.userData.orientation='HORIZONTAL_LINTEL';
  }
  g.userData={archaeologicalId,certainty:CERTAINTY.PROBABLE,title:'برنامج نقوش رأسي على القائمتين وأفقي على العتب',doctorRequirement:true};
  v6Group.add(g); return g;
}
function createOpenHathorCourtyardDetails(){
  const g=new THREE.Group(); g.name='Open_Hathor_Courtyard_29_V18';
  roundedBox(13.2,.30,17.2,.06,materials.limestoneAged,0,.15,-32,g,'Hathor_Courtyard_Raised_Paving');
  for(const x of[-5.65,5.65]) roundedBox(.36,.22,16.4,.05,materials.graniteDark,x,.31,-32,g,`Hathor_Courtyard_Perimeter_Curb_${x}`);
  for(const z of[-39.35,-24.65]) roundedBox(11.0,.22,.36,.05,materials.graniteDark,0,.31,z,g,`Hathor_Courtyard_Perimeter_Curb_${z}`);
  roundedBox(.20,.06,14.8,.025,materials.floorPatina,0,.34,-32,g,'Hathor_Courtyard_Central_Drainage_Wear');
  g.userData={archaeologicalId:29,certainty:CERTAINTY.INTERPRETIVE,title:'فناء حتحوري مفتوح من أعلى — تنفيذ مباشر لملاحظة الدكتور',doctorRequirement:true,openToSky:true};
  probableReconstructionGroup.add(g);
}


function createSimpleStoneColumn(x,z,{h=7.0,r=.48,material=materials.sandstone,variant='simple'}={}) {
  const g=new THREE.Group();g.name=`Simple_Stone_Column_${variant}_${x}_${z}`;
  const base=shadow(new THREE.Mesh(new THREE.CylinderGeometry(r*1.28,r*1.42,.34,24),material));base.position.y=.17;base.name='Simple_Column_Base';g.add(base);
  const shaft=shadow(new THREE.Mesh(new THREE.CylinderGeometry(r*.88,r, h-1.05,28),material));shaft.position.y=.34+(h-1.05)/2;shaft.name='Simple_Column_Shaft';g.add(shaft);
  roundedBox(r*2.25,.46,r*2.25,.07,material,0,h-.48,0,g,'Simple_Column_Capital');
  roundedBox(r*2.55,.28,r*2.55,.06,material,0,h-.11,0,g,'Simple_Column_Abacus');
  g.position.set(x,0,z);g.userData.columnInfo={title:'عمود حجري بسيط — إعادة بناء مرجحة',type:'Simple stone column',date:'أوسركون الثاني؛ الموضع والنسب مرجحة',rulers:'لا تنسب الصالة إلى ملك آخر دون دليل',dimensions:`ارتفاع رقمي ${h.toFixed(1)} م`,material:'حجر',confidence:'PROBABLE — نوع مبسط لحين وجود مرجع مباشر',source:'مراجعة الدكتور: الصالتان 27 و28 تستخدمان أعمدة حجرية أبسط',note:'لا يمثل هذا العمود قطعة أثرية بعينها.'};
  columnsGroup.add(g);addColumnAgeMarks(g,{h,r,seed:x*19+z*29,type:'simple'});g.traverse(o=>{if(o.isMesh){o.userData.columnInfo=g.userData.columnInfo;interactiveColumns.push(o);}});return g;
}
function column(x, z, { h = 8.7, r = .63, capital = 'papyrus', material = materials.sandstone, detail = 'standard', variant = '', northRotation = 0 } = {}) {
  if(capital==='simple') return createSimpleStoneColumn(x,z,{h,r,material,variant:variant||`${x}-${z}`});
  const type = capital === 'palm' ? 'palm' : capital === 'hathor' ? 'hathor' : 'papyrus';
  const group = createColumnByType(type, {
    materials, totalHeight: h, radius: r, position: new THREE.Vector3(x, 0, z), detail,
    variant: variant || `${type}-${x}-${z}`, material, northRotation
  });
  group.name = group.name || `${type}_Column_${x}_${z}`;
  columnsGroup.add(group);
  addColumnAgeMarks(group,{h,r,seed:x*17+z*31,type});
  group.traverse((obj) => { if (obj.isMesh) interactiveColumns.push(obj); });
  return group;
}

function columnGrid(xs, zs, options = {}) { for (const x of xs) for (const z of zs) column(x, z, options); }

function createBastetCultStatue(parent, x=0, y=.72, z=-72.85, scale=1) {
  const g=new THREE.Group(); g.name='Bastet_Cult_Focus_INTERPRETIVE';
  roundedBox(1.15*scale,.36*scale,.9*scale,.08*scale,materials.darkStone,0,.18*scale,0,g,'Bastet_Statue_Base');
  const body=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.19*scale,.36*scale,1.08*scale,24),materials.bronze)); body.position.y=.93*scale; body.name='Bastet_Statue_Body'; g.add(body);
  const head=shadow(new THREE.Mesh(new THREE.SphereGeometry(.25*scale,24,18),materials.bronze)); head.scale.set(.82,1.0,.78); head.position.y=1.56*scale; head.name='Bastet_Statue_Head'; g.add(head);
  for(const sx of[-1,1]){const ear=shadow(new THREE.Mesh(new THREE.ConeGeometry(.105*scale,.31*scale,14),materials.bronze));ear.position.set(sx*.15*scale,1.86*scale,0);ear.rotation.z=sx*.09;ear.name=`Bastet_Ear_${sx}`;g.add(ear);}
  g.position.set(x,y,z); g.userData={title:'تمثال باستت داخل المشكاة',certainty:CERTAINTY.INTERPRETIVE,sourceRefs:['Cult statue form not archaeologically preserved'],archaeologicalId:30,iconography:'cat-headed female form'}; parent.add(g); return g;
}
function addNaosDeity(parent,x,y,z,rotationY,name,scale=1){
  const deity=shadow(new THREE.Mesh(new THREE.CapsuleGeometry(.09*scale,.34*scale,4,8),materials.darkStone));
  deity.position.set(x,y,z);deity.rotation.y=rotationY;deity.name=name;parent.add(deity);return deity;
}
function addNaosDecoration(parent,layout) {
  const { frontFaceZ, bodyBottom, bodyTop, centerZ, bodyWidth, bodyDepth }=layout;
  const frontColumnY=bodyBottom+1.10;
  for(const x of[-.86,-.66,.66,.86]) roundedBox(.045,1.48,.035,.010,materials.darkStone,x,frontColumnY,frontFaceZ+.018,parent,`Naos_Front_Hieroglyph_Column_${x}`);
  for(let row=0;row<2;row++) for(let col=0;col<5;col++) addNaosDeity(parent,-.72+col*.36,bodyTop-.48+row*.20,frontFaceZ+.025,0,`Naos_Front_Deity_Register_${row}_${col}`,.20);
  for(const side of[-1,1]){
    const x=side*(bodyWidth/2+.018);
    for(const z of[centerZ-bodyDepth*.30,centerZ,centerZ+bodyDepth*.30]) roundedBox(.035,1.45,.045,.010,materials.darkStone,x,bodyBottom+1.08,z,parent,`Naos_${side<0?'Left':'Right'}_Text_${z}`);
    for(let row=0;row<2;row++) for(let col=0;col<3;col++) addNaosDeity(parent,x-side*.025,bodyBottom+.58+row*.52,centerZ-bodyDepth*.30+col*bodyDepth*.30,side<0?Math.PI/2:-Math.PI/2,`Naos_${side<0?'Left':'Right'}_Deity_${row}_${col}`,.19);
  }
}
function createBastetIconographyPanels(parent,layout){
  const items=[
    {name:'Bastet_Full_Cat_Iconography',x:-.62,form:'قطة كاملة الجسد'},
    {name:'Bastet_Cat_Headed_Woman_Iconography',x:0,form:'سيدة بجسد إنساني ورأس قطة'},
    {name:'Bastet_Lioness_Headed_Woman_Iconography',x:.62,form:'سيدة برأس لبؤة أو هيئة لبؤة'},
  ];
  for(const item of items){
    const plaque=roundedBox(.48,.72,.05,.018,materials.granite,item.x,layout.bodyBottom+.58,layout.backFaceZ+.025,parent,item.name);
    plaque.userData={title:item.form,archaeologicalId:30,certainty:CERTAINTY.ATTESTED,sourceRefs:['Bastet iconography documented in the review file'],placementCertainty:CERTAINTY.PROBABLE};
    const mark=shadow(new THREE.Mesh(new THREE.CapsuleGeometry(.04,.21,4,10),materials.darkStone));mark.position.set(item.x,layout.bodyBottom+.58,layout.backFaceZ+.058);mark.name=`${item.name}_Relief`;parent.add(mark);
  }
}
function createNectaneboNaos() {
  const n=MODEL_DIMENSIONS.naos;
  const bodyBottom=n.floorY+n.platformHeight,bodyTop=bodyBottom+n.bodyHeight;
  const frontOuterZ=n.centerZ+n.bodyDepth/2,backOuterZ=n.centerZ-n.bodyDepth/2;
  const frontWallZ=frontOuterZ-n.wallThickness/2,backWallZ=backOuterZ+n.wallThickness/2;
  const wallBottom=bodyBottom+n.bodyBaseHeight,wallTop=bodyTop-n.roofHeight-n.corniceHeight,wallHeight=wallTop-wallBottom;
  const layout={bodyBottom,bodyTop,frontFaceZ:frontOuterZ,backFaceZ:backOuterZ,centerZ:n.centerZ,bodyWidth:n.bodyWidth,bodyDepth:n.bodyDepth};
  const g=new THREE.Group(); g.name='Nectanebo_II_Naos_EA1078_EA1079_EA1080_V18';
  const meta={archaeologicalId:30,certainty:CERTAINTY.PROBABLE,title:'ناووس نختنبو الثاني — نسخة V18',sourceRefs:['British Museum EA1078','British Museum EA1079','British Museum EA1080','Figures 37, 38 and 45'],material:'جرانيت أحمر داكن متآكل بصريًا',sourceCertainty:CERTAINTY.ATTESTED,placementCertainty:CERTAINTY.PROBABLE,auditNote:'الأبعاد هدف تصميمي تقريبي مستند إلى صورة الدكتور وليست قياسًا أثريًا مؤكدًا؛ الحضور البصري تحققه القاعدة والإضاءة وزاوية الكاميرا.'};
  g.userData=meta;
  roundedBox(n.lowerPlatform.width,n.lowerPlatform.height,n.lowerPlatform.depth,.045,materials.darkStone,0,n.floorY+n.lowerPlatform.height/2,n.centerZ,g,'Naos_Lower_Platform_V18');
  roundedBox(n.upperPlatform.width,n.upperPlatform.height,n.upperPlatform.depth,.045,materials.graniteDark,0,n.floorY+n.lowerPlatform.height+n.upperPlatform.height/2,n.centerZ,g,'Naos_Upper_Platform_V18');
  roundedBox(n.bodyWidth,n.bodyBaseHeight,n.bodyDepth,.045,materials.granite,0,bodyBottom+n.bodyBaseHeight/2,n.centerZ,g,'Naos_Base_EA1078_V18');
  roundedBox(n.bodyWidth,wallHeight,n.wallThickness,.045,materials.graniteDark,0,wallBottom+wallHeight/2,backWallZ,g,'Naos_Red_Granite_Back_EA1079');
  roundedBox(n.wallThickness,wallHeight,n.bodyDepth,.045,materials.graniteDark,-(n.bodyWidth-n.wallThickness)/2,wallBottom+wallHeight/2,n.centerZ,g,'Naos_Red_Granite_Left_EA1078');
  roundedBox(n.wallThickness,wallHeight,n.bodyDepth,.045,materials.graniteDark,(n.bodyWidth-n.wallThickness)/2,wallBottom+wallHeight/2,n.centerZ,g,'Naos_Red_Granite_Right_EA1078');
  const jambX=n.openingWidth/2+.14,jambCenterY=wallBottom+n.openingHeight/2;
  roundedBox(.28,n.openingHeight,n.wallThickness+.04,.035,materials.granite,-jambX,jambCenterY,frontWallZ,g,'Naos_Front_Frame_Left_Jamb');
  roundedBox(.28,n.openingHeight,n.wallThickness+.04,.035,materials.granite,jambX,jambCenterY,frontWallZ,g,'Naos_Front_Frame_Right_Jamb');
  roundedBox(n.openingWidth+.56,.30,n.wallThickness+.04,.035,materials.granite,0,wallBottom+n.openingHeight+.15,frontWallZ,g,'Naos_Front_Frame_Lintel');
  for(const x of[-(n.bodyWidth/2-.09),n.bodyWidth/2-.09]) roundedBox(.12,wallHeight,n.wallThickness+.06,.025,materials.graniteDark,x,wallBottom+wallHeight/2,frontWallZ,g,`Naos_Pilaster_${x<0?'Left':'Right'}`);
  roundedBox(n.bodyWidth-.16,.16,n.wallThickness+.10,.025,materials.granite,0,wallTop-.08,frontWallZ,g,'Nectanebo_Naos_Lintel_EA1080');
  createCavettoCornice(n.bodyWidth,n.wallThickness+.12,.12,materials.granite,0,bodyTop-n.roofHeight-n.corniceHeight/2,frontWallZ,g,'Naos_Cavetto_Cornice_EA1080');
  roundedBox(n.bodyWidth,n.roofHeight,n.bodyDepth,.045,materials.graniteDark,0,bodyTop-n.roofHeight/2,n.centerZ,g,'Naos_Granite_Roof_EA1079');
  addNaosDecoration(g,layout);
  roundedBox(.96,1.82,.07,.025,materials.shadow,0,bodyBottom+1.18,backOuterZ+.08,g,'Naos_Interior_Polished_Niche');
  for(const sx of[-1,1]) for(let i=0;i<5;i++) roundedBox(.04,.13,.025,.008,materials.darkStone,sx*.72,bodyBottom+.42+i*.27,frontOuterZ+.018,g,`Naos_Vertical_Inscription_${sx}_${i}`);
  createBastetCultStatue(g,0,bodyBottom+n.bodyBaseHeight+.03,n.centerZ-.60,.62);
  createBastetIconographyPanels(g,layout);
  v6Group.add(g); return g;
}


function createOfferingTable(x, z, scale = 1) {
  const g = new THREE.Group(); g.name = `Offering_Table_${x}_${z}`;
  roundedBox(4 * scale, .5 * scale, 2.6 * scale, .10, materials.granite, 0, 2.2 * scale, 0, g, 'Offering_Table_Top');
  const stem = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.5 * scale, .7 * scale, 2.2 * scale, 24), materials.granite));
  stem.position.y = 1.1 * scale; stem.name = 'Offering_Table_Stem'; g.add(stem);
  roundedBox(2.1 * scale, .28 * scale, 1.8 * scale, .08, materials.granite, 0, .14 * scale, 0, g, 'Offering_Table_Base');
  g.position.set(x, 0, z); ritualGroup.add(g); return g;
}

function createHebSedFestivalKiosk() {
  const g=new THREE.Group(); g.name='HebSed_Festival_Kiosk_PROBABLE';
  const kx=-6.2,kz=18.5;
  roundedBox(6.6,.48,4.8,.10,materials.granite,kx,.24,kz,g,'HebSed_Kiosk_Base');
  for(const x of[kx-2.35,kx+2.35]) for(const z of[kz-1.55,kz+1.55]) {
    const c=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.23,.31,3.5,22),materials.granite)); c.position.set(x,2.0,z); c.name='HebSed_Kiosk_Column'; g.add(c);
  }
  roundedBox(7.0,.48,5.2,.10,materials.granite,kx,3.98,kz,g,'HebSed_Kiosk_Roof');
  g.userData={title:'مقصورة احتفالية داخل صالة حب سد',archaeologicalId:26,certainty:CERTAINTY.PROBABLE,sourceRefs:['Festival-hall relief program; placement reconstructed'],placement:'off-axis to preserve the central processional route'};
  probableReconstructionGroup.add(g); return g;
}
const HISTORICAL_EVIDENCE = [
  {id:'Khufu_Khafre',x:-15,title:'خوفو وخفرع',text:'عُثر على اسمي خوفو وخفرع، مما يرجح وجود مرحلة بناء أو نشاط بالمعبد منذ الأسرة الرابعة. لا ينسب إليهما الصرح أو الصالات الحالية لأن تخطيط تلك الفترة غير معروف.'},
  {id:'Pepi_I',x:-10,title:'بيبي الأول',text:'تشير المصادر إلى أنه شيد معبدًا تكريمًا لباستت، لكن لا يوضع هذا المعبد تلقائيًا داخل تخطيط العناصر 23–30 ولا تنسب إليه إحدى صالاته دون دليل.'},
  {id:'Amenemhat_I',x:-5,title:'أمنمحات الأول',text:'شيد بوابة لباستت، إلا أن الدعامة المنقوشة عُثر عليها داخل معبد نختنبو الثاني وقد تكون معاد استخدامها؛ لذلك لا يثبت لها موضع أصلي محدد في النموذج.'},
  {id:'Amenemhat_III',x:5,title:'أمنمحات الثالث',text:'شيد مقرًا أو قصرًا من الطوب اللبن في تل بسطة، وليس مؤكدًا أنه جزء من المعبد الكبير؛ لذلك لا يدمج داخل تسلسل غرف المعبد.'},
  {id:'Ramesses_II',x:10,title:'رمسيس الثاني',text:'وُجدت تماثيل وبقايا تحمل اسمه، ومنها تمثال من الجرانيت الوردي بين بتاح وباستت، وأعيد استخدام بعض آثاره في عصر أوسركون الثاني. لا تنسب إليه صالة كاملة دون مرجع مستقل.'},
  {id:'Historical_Method',x:15,title:'قاعدة النسبة التاريخية',text:'تُفصل الأدلة النصية والقطع المعاد استخدامها عن التخطيط المعماري المتأخر؛ العثور على اسم ملك لا يثبت أنه شيد الفراغ الرقمي الذي تظهر فيه المعلومة.'},
];
function createHistoricalEvidenceHotspots(){
  for(const item of HISTORICAL_EVIDENCE){
    const g=new THREE.Group();g.name=`Historical_Evidence_${item.id}_INTERPRETIVE`;
    roundedBox(2.45,.18,1.18,.05,materials.limestone,0,.09,0,g,`${item.id}_Display_Base`);
    const stela=roundedBox(1.18,1.18,.18,.05,materials.limestone,0,.76,0,g,`${item.id}_Info_Stela`);
    roundedBox(1.02,.94,.025,.02,materials.darkStone,0,.77,.103,g,`${item.id}_Info_Panel`);
    roundedBox(.88,.08,.03,.02,materials.limestone,0,1.14,.118,g,`${item.id}_Info_TitleBand`);
    stela.userData={title:item.title,englishTitle:'Historical evidence note',description:item.text,confidence:'ATTESTED evidence; display position INTERPRETIVE',type:'Hotspot تاريخي',material:'لوحة عرض تفسيرية حجرية',period:'فترات متعددة',source:'مراجعة الدكتور — تصحيح نسبة الأعمال إلى الملوك',archaeologicalId:23};
    g.position.set(item.x,0,113.7);interpretiveAdditionsGroup.add(g);
  }
}
function createCanopusDecreeHotspot(){
  const g=new THREE.Group();g.name='Canopus_Decree_Hotspot_INTERPRETIVE';
  roundedBox(2.05,.22,1.08,.06,materials.limestone,0,.11,0,g,'Canopus_Display_Base');
  const fragShape=new THREE.Shape();
  fragShape.moveTo(-.46,-.70);fragShape.lineTo(.32,-.70);fragShape.lineTo(.40,-.35);fragShape.lineTo(.34,.58);fragShape.quadraticCurveTo(.08,.78,-.10,.72);fragShape.lineTo(-.34,.64);fragShape.quadraticCurveTo(-.52,.20,-.46,-.70);
  const fragGeom=new THREE.ExtrudeGeometry(fragShape,{depth:.20,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,curveSegments:18,steps:1});
  const fragment=shadow(new THREE.Mesh(fragGeom,materials.darkStone));
  fragment.rotation.x=Math.PI;fragment.position.set(0,.46,.10);fragment.name='Canopus_Decree_Fragment';g.add(fragment);
  const inscriptionMat=materials.limestone.clone();inscriptionMat.color=new THREE.Color(0xb9ad95);
  for(let row=0;row<5;row++)for(let col=0;col<5;col++)roundedBox(.06,.035,.014,.008,inscriptionMat,-.24+col*.12,.56+row*.12,.204,g,`Canopus_Demotic_Glyph_${row}_${col}`);
  for(let row=0;row<4;row++)for(let col=0;col<6;col++)roundedBox(.055,.03,.014,.008,inscriptionMat,-.30+col*.11,1.18+row*.105,.204,g,`Canopus_Greek_Glyph_${row}_${col}`);
  roundedBox(.62,.045,.014,.006,inscriptionMat,.03,1.63,.204,g,'Canopus_Crown_Line');
  fragment.userData={title:'مرسوم كانوب — نقطة معلومات',englishTitle:'Canopus Decree information point',description:'عُثر على جزء من مرسوم كانوب في صالة مدخل معبد باستت. يرجع إلى عهد بطلميوس الثالث، ويضم في الجزء المكتشف كتابة ديموطيقية ويونانية. موضع عرض هذا النموذج داخل الجولة تفسيري ولا يمثل موضعه الأصلي المؤكد.',confidence:'INTERPRETIVE display position; entrance-hall find association ATTESTED',type:'Hotspot information model',material:'Basalt fragment on a small explanatory plinth',period:'Ptolemy III',source:'Canopus Decree fragment from Bubastis',archaeologicalId:24,special:'canopus',image:'./assets/canopus-decree-schematic.svg'};
  g.position.set(8.4,0,82);interpretiveAdditionsGroup.add(g);return g;
}
function createEnclosureDecoration(){
  const g=new THREE.Group();g.name='Eastern_Enclosure_Text_And_Relief_Bands';
  for(const x of[-13.5,13.5]){
    roundedBox(12.5,.42,.16,.04,materials.granite,x,3.1,119.0,g,`Herodotus_Enclosure_Relief_Band_${x}`);
    for(let i=0;i<10;i++)roundedBox(.32,.28,.08,.02,materials.darkStone,x-4.6+i*1.02,3.1,119.10,g,`Enclosure_Unspecified_Relief_${x}_${i}`);
  }
  const title=roundedBox(13.5,1.2,.18,.04,materials.granite,0,5.4,119.02,g,'Eastern_Enclosure_Bastet_Title_Inscription');
  title.userData={title:'لقب باستت على الجدار الشرقي',description:'نقش كتابي تفسيري للموقع يتضمن اللقب الموثق نصيًا: «باستت العظيمة، سيدة برباستت…». شكل العلامات وترتيبها الرقمي مرجح.',confidence:'النص ATTESTED؛ الترتيب البصري PROBABLE',type:'نقش كتابي',material:'جرانيت/حجر',period:'غير محدد للعرض الرقمي',source:'مراجعة الدكتور — الجدار الشرقي للسور',archaeologicalId:23};
  for(let i=0;i<12;i++)roundedBox(.34,.62,.08,.02,materials.darkStone,-5.4+i*.98,5.4,119.13,g,`Bastet_Title_Glyph_${i}`);
  g.userData={certainty:CERTAINTY.PROBABLE,sourceRefs:['Herodotus describes decorated enclosure walls','Attested Bastet title on the eastern enclosure wall']};probableReconstructionGroup.add(g);
}

function createPalm(x, z, scale = 1) {
  const g = new THREE.Group(); g.name = 'Environment_Palm';
  const trunk = shadow(new THREE.Mesh(new THREE.CylinderGeometry(.30 * scale, .48 * scale, 8.5 * scale, 14), new THREE.MeshStandardMaterial({ color: 0x7b5737, roughness: 1 })));
  trunk.position.y = 2.35 * scale; g.add(trunk);
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x526b42, roughness: .92, side: THREE.DoubleSide });
  for (let i = 0; i < 10; i++) {
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(.42 * scale, 4.6 * scale, 8), leafMat);
    const a = i * Math.PI * 2 / 10; leaf.position.set(Math.cos(a) * 1.25 * scale, 6.7 * scale, Math.sin(a) * 1.25 * scale);
    leaf.rotation.z = Math.PI / 2.8; leaf.rotation.y = -a; g.add(leaf);
  }
  g.position.set(x, -1.8, z); environment.add(g); return g;
}

const reliefTextureLoader = new THREE.TextureLoader();
async function loadReliefTexture(path, color = false) {
  if (!path) return null;
  if (textureCache.has(path)) return textureCache.get(path);
  try {
    const tex = await reliefTextureLoader.loadAsync(path);
    if (color) tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    textureCache.set(path, tex); return tex;
  } catch (error) {
    console.warn(`Optional relief texture failed to load: ${path}`, error);
    textureCache.set(path, null);
    return null;
  }
}

function composeReliefAlbedo(baseTexture, lineTexture) {
  if (!baseTexture?.image || !lineTexture?.image) return baseTexture || lineTexture || null;
  const w = Math.max(baseTexture.image.width || 0, lineTexture.image.width || 0), h = Math.max(baseTexture.image.height || 0, lineTexture.image.height || 0);
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#d1c0a1'; ctx.fillRect(0,0,w,h);
  ctx.drawImage(baseTexture.image, 0, 0, w, h);
  ctx.globalAlpha = .92; ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(lineTexture.image, 0, 0, w, h);
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function orientRelief(mesh, normal) {
  if (normal === 'z-') mesh.rotation.y = Math.PI;
  else if (normal === 'x+') mesh.rotation.y = Math.PI / 2;
  else if (normal === 'x-') mesh.rotation.y = -Math.PI / 2;
}
function intervalOverlap(aMin, aMax, bMin, bMax) { return Math.max(0, Math.min(aMax, bMax) - Math.max(aMin, bMin)); }
function isWallCandidateMesh(obj) {
  if (!obj?.isMesh || !obj.geometry) return false;
  const name = obj.name || '';
  if (/Relief|Glyph|Deity|Statue|Cult|Offering|Incense|Star|Pigment|Column|Palm|Hathor|Canopus|Historical|Ruin|Marker|Dust|Wear/i.test(name)) return false;
  const box = new THREE.Box3().setFromObject(obj), size = new THREE.Vector3();
  box.getSize(size);
  return size.y > 1.4 && (size.x > 1.2 || size.z > 1.2);
}
function snapReliefToNearestWall(mesh, normal, gap = 0.008) {
  const panelBox = new THREE.Box3().setFromObject(mesh);
  const panelSize = new THREE.Vector3();
  panelBox.getSize(panelSize);
  const axis = normal.startsWith('x') ? 'x' : 'z';
  let best = null;
  for (const group of [architectureGroup, v6Group]) {
    group.traverse((obj) => {
      if (!isWallCandidateMesh(obj) || obj === mesh || !isEffectivelyVisible(obj)) return;
      const box = new THREE.Box3().setFromObject(obj), size = new THREE.Vector3();
      box.getSize(size);
      if (axis === 'x') {
        const yOverlap = intervalOverlap(panelBox.min.y, panelBox.max.y, box.min.y, box.max.y);
        const zOverlap = intervalOverlap(panelBox.min.z, panelBox.max.z, box.min.z, box.max.z);
        if (yOverlap < Math.min(panelSize.y * .28, .8) || zOverlap < Math.min(Math.max(panelSize.z * .30, .9), panelSize.z + .6)) return;
        const target = normal === 'x+' ? box.max.x + gap : box.min.x - gap;
        const score = Math.abs(mesh.position.x - target);
        if (!best || score < best.score) best = { target, score, axis: 'x', box, size };
      } else {
        const yOverlap = intervalOverlap(panelBox.min.y, panelBox.max.y, box.min.y, box.max.y);
        const xOverlap = intervalOverlap(panelBox.min.x, panelBox.max.x, box.min.x, box.max.x);
        if (yOverlap < Math.min(panelSize.y * .28, .8) || xOverlap < Math.min(Math.max(panelSize.x * .30, .9), panelSize.x + .6)) return;
        const target = normal === 'z+' ? box.max.z + gap : box.min.z - gap;
        const score = Math.abs(mesh.position.z - target);
        if (!best || score < best.score) best = { target, score, axis: 'z', box, size };
      }
    });
  }
  if (best) {
    const sourceW = mesh.geometry.parameters.width || panelSize.x;
    const sourceH = mesh.geometry.parameters.height || panelSize.y;
    const availableH = Math.max(1.1, (best.box.max.y - best.box.min.y) - .7);
    const availableW = axis === 'x' ? Math.max(1.1, (best.box.max.z - best.box.min.z) - .65) : Math.max(1.1, (best.box.max.x - best.box.min.x) - .65);
    const scaleFactor = Math.min(1, (availableW / sourceW) * .96, (availableH / sourceH) * .96);
    mesh.scale.setScalar(scaleFactor);
    mesh.position[best.axis] = best.target;
    if (axis === 'x') {
      const half = sourceW * scaleFactor * .5;
      mesh.position.z = THREE.MathUtils.clamp(mesh.position.z, best.box.min.z + half + .12, best.box.max.z - half - .12);
    } else {
      const half = sourceW * scaleFactor * .5;
      mesh.position.x = THREE.MathUtils.clamp(mesh.position.x, best.box.min.x + half + .12, best.box.max.x - half - .12);
    }
    const halfH = sourceH * scaleFactor * .5;
    mesh.position.y = THREE.MathUtils.clamp(mesh.position.y, best.box.min.y + halfH + .12, best.box.max.y - halfH - .12);
    mesh.updateMatrixWorld(true);
    mesh.userData.wallFlush = true;
    mesh.userData.fittedScale = scaleFactor;
  }
}
function snapAllReliefsToWalls() {
  for (const mesh of interactiveReliefs) snapReliefToNearestWall(mesh, mesh.userData?.mountNormal || 'z+');
}
async function createReliefPanel(assetId, name, w, h, x, y, z, normal = 'z+', displacementScale = .12, placementRole='wall-register') {
  const a = assetById.get(assetId); if (!a) return null;
  const [colorMap, normalMap, roughnessMap, displacementMap, alphaMap, stoneMap, aoMap] = await Promise.all([
    loadReliefTexture(a.color, true), loadReliefTexture(a.normal), loadReliefTexture(a.roughness),
    loadReliefTexture(a.height), loadReliefTexture(a.alpha), loadReliefTexture(a.stone, true), loadReliefTexture(a.ao)
  ]);
  const composedMap = composeReliefAlbedo(stoneMap, colorMap || stoneMap);
  const mat = new THREE.MeshStandardMaterial({
    map: composedMap || stoneMap || colorMap, normalMap, normalScale:new THREE.Vector2(.72,.72), roughnessMap, displacementMap, displacementScale:Math.max(.09,displacementScale*1.38),
    side: THREE.FrontSide, roughness: .78, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2
  });
  const tintSeed=[...name].reduce((a,c)=>a+c.charCodeAt(0),0);
  mat.color.setHSL(.095+(tintSeed%9)*.002,.19,.74-(tintSeed%7)*.008);
  mat.userData = { colorMap, stoneMap, alphaMap, composedMap }; reliefMaterials.push(mat);

  // `w` and `h` are placement bounds, not a license to stretch the archaeological plate.
  // Preserve the corrected source aspect ratio so standing figures and registers retain
  // their published proportions after the orientation audit.
  const visualMap = composedMap || stoneMap || colorMap;
  const texW = visualMap?.image?.width || w, texH = visualMap?.image?.height || h;
  const textureAspect = Math.max(.01, texW / Math.max(1, texH));
  const boundsAspect = Math.max(.01, w / Math.max(.01, h));
  let panelW = w, panelH = h;
  if (textureAspect > boundsAspect) panelH = w / textureAspect;
  else panelW = h * textureAspect;

  const segX = Math.max(18, Math.min(72, Math.round(panelW * 2.4))), segY = Math.max(12, Math.min(48, Math.round(panelH * 2.4)));
  const geometry = new THREE.PlaneGeometry(panelW, panelH, segX, segY);
  // Three.js r185 maps Texture.channel=1 to the geometry's uv1/TEXCOORD_1 channel.
  // AO is enabled only for newly generated close-view maps with a valid secondary UV set.
  if (aoMap && geometry.attributes.uv) {
    geometry.setAttribute('uv1', geometry.attributes.uv.clone());
    aoMap.channel = 1;
    mat.aoMap = aoMap;
    mat.aoMapIntensity = .46;
  }
  const mesh = shadow(new THREE.Mesh(geometry, mat));
  mesh.position.set(x, y, z); orientRelief(mesh, normal); mesh.name = name; mesh.renderOrder = 3;
  const hebSedComparanda = a.zone === 5 ? ['Louvre E10592','Penn Museum E225','Figure 18','Figure 19'] : [];
  mesh.userData = {
    title:a.title, source:a.source, confidence:a.certainty, zone:a.zone, archaeologicalId:a.zone===5?26:null,
    note:`المصدر المباشر: ${a.source}; المشهد الأثري موثق بينما موضع اللوحة الحالي قد يكون مرجحاً.`,
    sourceId:a.id, stoneType:a.stoneType, image:a.color, sourceRefs:[a.source,...hebSedComparanda],
    sourceCertainty:CERTAINTY.ATTESTED, placementCertainty:CERTAINTY.PROBABLE, mountNormal: normal, placementRole, reliefDepth:'V18 enhanced normal + displacement', aoChannel:aoMap?'uv1/TEXCOORD_1':null,
    referenceOrientationCorrectionDeg:a.referenceOrientationCorrectionDeg || 0, horizontalMirror:!!a.horizontalMirror,
    reliefAspectRatio:textureAspect, reliefPanelSize:{ width:panelW, height:panelH }
  };
  reliefsGroup.add(mesh); interactiveReliefs.push(mesh); return mesh;
}
async function buildReliefs() {
  const placements = [
    ['entrance_adoration','East_Pylon_Left_Adoration',8.5,6.2,-10.5,10.0,112.0,'z+',.11],
    ['sed_ritual_objects','East_Pylon_Right_Ritual_Objects',8.5,6.2,10.5,10.0,112.0,'z+',.11],
    ['sed_figures_and_text','Pylon_Inner_Left',8.0,5.6,-10.5,9.2,104.0,'z-',.10],
    ['sed_offering_bands','Pylon_Inner_Right',8.0,5.6,10.5,9.2,104.0,'z-',.10],
    ['reconstructed_kheker_band','Entrance_Lintel_Frieze',7.0,1.45,0,13.55,111.9,'z+',.06],
    ['sed_royal_kiosk','HebSed_E10592_Comparative_Panel',9.0,5.8,-6.1,5.0,44.95,'z-',.19],
    ['sanctuary_king_before_bastet','HebSed_E225_Bastet_Receives_Osorkon',9.0,5.8,6.1,5.0,44.95,'z-',.19],
    ['sed_procession_fragment','HebSed_Left_East_Procession',10.0,5.2,-11.05,4.3,38,'x+',.18],
    ['sed_offering_registers','HebSed_Left_Centre_Offerings',10.0,5.2,-11.05,4.3,26.5,'x+',.18],
    ['sed_deity_rows','HebSed_Left_West_Deities',9.0,5.2,-11.05,4.3,15,'x+',.18],
    ['sed_multi_register_02','HebSed_Right_East_Registers',10.0,5.2,11.05,4.3,38,'x-',.18],
    ['sed_long_register','HebSed_Right_Centre_LongRegister',10.0,5.2,11.05,4.3,26.5,'x-',.18],
    ['sed_large_composite','HebSed_Right_West_Composite',9.0,5.2,11.05,4.3,15,'x-',.18],
    ['sed_kiosk_procession_02','HebSed_West_Left_Kiosk',9.0,5.0,-6.1,4.2,7.95,'z+',.17],
    ['sed_ritual_group_03','HebSed_West_Right_RitualGroup',9.0,5.0,6.1,4.2,7.95,'z+',.17],
    ['main_hall_ritual','MainHall27_Left_Ritual',12.5,4.7,-6.05,3.8,-.5,'x+',.13],
    ['sed_seated_and_standing','MainHall27_Right_Ritual',12.5,4.7,6.05,3.8,-.5,'x-',.13],
    ['inner_hall_deities','MainHall28_Left_Deities',12.5,4.7,-6.05,3.8,-15.5,'x+',.13],
    ['sed_deity_inventory','MainHall28_Right_Inventory',12.5,4.7,6.05,3.8,-15.5,'x-',.13],
    ['hathor_court_register','HathorCourt_Left_Register',14.0,4.4,-6.05,3.8,-32,'x+',.12],
    ['sed_divine_figures','HathorCourt_Right_Register',14.0,4.4,6.05,3.8,-32,'x-',.12],
    ['sanctuary_king_before_bastet','Sanctuary_Approach_King_Bastet_Left',8.0,4.5,-5.0,4.0,-40.05,'z+',.15],
    ['sanctuary_deity_inventory','Sanctuary_Approach_Deities_Right',8.0,4.5,5.0,4.0,-40.05,'z+',.15],
    ['sanctuary_shrine_inventory','Sanctuary_Left_Shrine_List',12.0,4.2,-9.05,3.7,-64,'x+',.13],
    ['sanctuary_seven_arrows','Sanctuary_Right_Seven_Arrows',12.0,4.2,9.05,3.7,-64,'x-',.13],
    ['reconstructed_kheker_band','Sanctuary_Text_Band_Approximation',17.0,1.05,0,6.3,-40.02,'z+',.05],
  ];
  const results=await Promise.allSettled(placements.map((placement) => createReliefPanel(...placement)));
  const failed=results.filter(r=>r.status==='rejected');
  if(failed.length) console.warn(`${failed.length} optional relief panels used fallback/failed`,failed);
  snapAllReliefsToWalls();
}


function beamX(x1, x2, y, z, { h = .9, d = 1.3, mat = materials.sandstone, radius = .14, name = 'Architrave_X' } = {}) {
  return roundedBox(Math.abs(x2 - x1) + 2.1, h, d, radius, mat, (x1 + x2) / 2, y, z, roofsGroup, name);
}
function beamZ(x, z1, z2, y, { w = 1.3, h = .9, mat = materials.sandstone, radius = .14, name = 'Architrave_Z' } = {}) {
  return roundedBox(w, h, Math.abs(z2 - z1) + 2.1, radius, mat, x, y, (z1 + z2) / 2, roofsGroup, name);
}
function roofSlab(x, z, w, d, y, { t = .58, mat = materials.limestone, radius = .10, name = 'Roof_Slab' } = {}) {
  const roofMaterial = mat === materials.limestone ? materials.roofLimestone : mat === materials.sandstone ? materials.roofSandstone : mat === materials.granite ? materials.roofGranite : mat;
  const slab = roundedBox(w, t, d, radius, roofMaterial, x, y, z, roofsGroup, name);
  slab.userData.structuralRole = 'roof-slab';
  return slab;
}
function tieHallColumns({ xs, zs, beamY, roofY = null, beamMaterial = materials.sandstone, roofMaterial = materials.limestone, roofBands = [], beamDepth = 1.3, beamWidth = 1.3, suffix = 'Hall' }) {
  for (const z of zs) {
    for (let i = 0; i < xs.length - 1; i++) beamX(xs[i], xs[i + 1], beamY, z, { d: beamDepth, mat: beamMaterial, name: `${suffix}_BeamX_${z}_${i}` });
  }
  for (const x of xs) {
    for (let i = 0; i < zs.length - 1; i++) beamZ(x, zs[i], zs[i + 1], beamY, { w: beamWidth, mat: beamMaterial, name: `${suffix}_BeamZ_${x}_${i}` });
  }
  if (roofY !== null) {
    roofBands.forEach((band, i) => roofSlab(band.x, band.z, band.w, band.d, roofY, { t: band.t ?? 1.15, mat: band.mat ?? roofMaterial, name: `${suffix}_Roof_${i}` }));
  }
}

function createStarShape(radius=.16, points=8) {
  const shape=new THREE.Shape();
  for(let i=0;i<points*2;i++){
    const a=-Math.PI/2+i*Math.PI/points,r=i%2===0?radius:radius*.38,x=Math.cos(a)*r,y=Math.sin(a)*r;
    if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);
  }
  shape.closePath();return shape;
}
function createEngravedStarCeiling() {
  const g=new THREE.Group();g.name='Nectanebo_Star_Ceiling_Figure33';
  roundedBox(11.8,.52,16.5,.09,materials.granite,0,8.75,-68.5,g,'Sanctuary_Granite_Star_Roof_Slab');
  const recessMat=new THREE.MeshStandardMaterial({color:0x3b2926,roughness:.96,metalness:0,side:THREE.DoubleSide});
  const pigmentMat=materials.paintedBlue.clone();pigmentMat.opacity=.18; pigmentMat.depthWrite=false;
  let index=0;
  for(let z=-75.6;z<=-61.4;z+=1.45) for(let x=-4.9;x<=4.9;x+=1.4){
    const geom=new THREE.ShapeGeometry(createStarShape(.16,8));
    const carved=new THREE.Mesh(geom,recessMat); carved.rotation.x=Math.PI/2; carved.position.set(x,8.475,z); carved.name=`Engraved_Star_${index}`; g.add(carved);
    const trace=new THREE.Mesh(geom.clone(),pigmentMat);trace.rotation.x=Math.PI/2;trace.position.set(x,8.465,z);trace.name=`Pigment_Trace_Star_${index}`;pigmentTracesGroup.add(trace);index++;
  }
  g.userData={title:'السقف النجمي المحفور',archaeologicalId:30,certainty:CERTAINTY.PROBABLE,sourceRefs:['Figure 33 — granite ceiling fragment with stars'],noEmissive:true}; v6Group.add(g);return g;
}
function createNectaneboLintel() {
  const g=new THREE.Group();g.name='Nectanebo_Entrance_Lintel_Figure34';
  roundedBox(11.5,.9,1.95,.10,materials.granite,0,7.55,-41,g,'Nectanebo_Lintel_Main');
  createCavettoCornice(12.6,2.05,.44,materials.granite,0,8.22,-41,g,'Nectanebo_Lintel_Cornice');
  // Upper repeated band, two vertical text columns, and a restrained central divine/royal scene.
  for(let i=0;i<11;i++)roundedBox(.28,.34,.08,.02,materials.darkStone,-4.9+i*.98,7.82,-39.98,g,`Nectanebo_Lintel_Upper_Glyph_${i}`);
  for(const x of[-4.8,4.8])for(let i=0;i<5;i++)roundedBox(.26,.38,.08,.02,materials.darkStone,x,5.2+i*.48,-39.98,g,`Nectanebo_Lintel_Vertical_Text_${x}_${i}`);
  for(let i=0;i<5;i++)addNaosDeity(g,-2.1+i*1.05,6.2,-39.98,0,`Nectanebo_Lintel_Central_Scene_${i}`);
  g.userData={title:'عتب مدخل معبد نختنبو الثاني',archaeologicalId:30,certainty:CERTAINTY.PROBABLE,sourceRefs:['Figure 34 — lintel fragment from Nectanebo II temple']};v6Group.add(g);return g;
}
function createSanctuaryV18Enhancements() {
  const g=new THREE.Group(); g.name='Sanctuary_V18_Doctor_Refined_Enhancements';
  roundedBox(6.2,.46,6.8,.10,materials.granite,0,.23,-69.5,g,'Sanctuary_Podium');
  roundedBox(4.0,.28,2.2,.08,materials.limestone,0,.14,-58.6,g,'Sanctuary_Threshold_Platform');
  roundedBox(5.6,4.8,.18,.04,materials.darkStone,0,3.0,-72.85,g,'Sanctuary_Rear_Text_Band');
  roundedBox(4.7,.16,.14,.03,materials.darkStone,0,5.92,-58.98,g,'Sanctuary_Entrance_Text_Band');
  for(const {x,z,d} of[{x:-3.9,z:-70.6,d:4.0},{x:3.9,z:-71.2,d:2.8}]){
    roundedBox(.14,4.2,d,.03,materials.darkStone,x,2.9,z,g,`Sanctuary_Side_Text_Band_${x<0?'West':'East'}`);
  }
  for(const x of[-2.1,2.1]){
    const stem=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.10,.14,1.05,16),materials.bronze));stem.position.set(x,.53,-59.4);stem.name='Sanctuary_Incense_Stand';g.add(stem);
    const bowl=shadow(new THREE.Mesh(new THREE.CylinderGeometry(.23,.18,.18,18),materials.granite));bowl.position.set(x,1.12,-59.4);bowl.name='Sanctuary_Incense_Bowl';g.add(bowl);
  }
  roundedBox(1.8,.58,1.45,.08,materials.granite,0,.45,-62.3,g,'Sanctuary_Central_Offering_Block');
  roundedBox(.26,2.9,.22,.04,materials.granite,-5.45,2.0,-58.9,g,'Sanctuary_Left_SideChamber_Jamb');
  roundedBox(.26,2.9,.22,.04,materials.granite,5.45,2.0,-58.9,g,'Sanctuary_Right_SideChamber_Jamb');
  roundedBox(1.25,.18,.45,.03,materials.granite,-5.45,1.42,-58.86,g,'Sanctuary_Left_SideChamber_Threshold');
  roundedBox(1.25,.18,.45,.03,materials.granite,5.45,1.42,-58.86,g,'Sanctuary_Right_SideChamber_Threshold');
  g.userData={category:'sanctuary',title:'تأثيث طقسي محدود',certainty:CERTAINTY.INTERPRETIVE,sourceRefs:['Ritual function inferred from relief program']}; interpretiveAdditionsGroup.add(g);
  createEngravedStarCeiling();createNectaneboLintel();
}
function buildColumnSuperstructure() {
  // V18: visibly heavy stone construction. Zone 29 is deliberately open to the sky per the doctor's request.
  tieHallColumns({xs:[-8,-2.7,2.7,8],zs:[78,88],beamY:9.72,roofY:10.65,suffix:'Zone24_Monumental',beamDepth:1.18,beamWidth:1.18,beamMaterial:materials.limestoneAged,roofBands:[{x:-6,z:82,w:10.4,d:22.5,t:1.18},{x:6,z:82,w:10.4,d:22.5,t:1.18}]});
  tieHallColumns({xs:[-8,-4,0,4,8],zs:[54,63],beamY:9.02,roofY:9.90,suffix:'Zone25_Dense',beamDepth:1.08,beamWidth:1.08,beamMaterial:materials.sandstoneWarm,roofBands:[{x:-6,z:58,w:10.4,d:22.5,t:1.10,mat:materials.sandstoneWarm},{x:6,z:58,w:10.4,d:22.5,t:1.10,mat:materials.sandstoneWarm}]});
  roofSlab(-6.15,26.5,11.1,37.2,8.48,{t:1.18,mat:materials.granite,name:'HebSed_Heavy_Stone_Roof_Left_PROBABLE'});
  roofSlab(6.15,26.5,11.1,37.2,8.48,{t:1.18,mat:materials.granite,name:'HebSed_Heavy_Stone_Roof_Right_PROBABLE'});
  tieHallColumns({xs:[-4.5,0,4.5],zs:[-3,3],beamY:7.48,roofY:8.48,suffix:'MainHall27_Heavy',beamDepth:1.12,beamWidth:1.12,beamMaterial:materials.limestoneAged,roofBands:[{x:0,z:-.5,w:13.4,d:14.2,t:1.34,mat:materials.limestoneAged}]});
  tieHallColumns({xs:[-4.5,0,4.5],zs:[-18,-12],beamY:7.42,roofY:8.42,suffix:'MainHall28_Heavy',beamDepth:1.18,beamWidth:1.18,beamMaterial:materials.sandstoneAged,roofBands:[{x:0,z:-15.5,w:13.4,d:14.2,t:1.42,mat:materials.sandstoneAged}]});
  // No Hathor courtyard roof or cross-beams here: the sky must remain visibly open.
  roofSlab(0,-45,19.4,7.3,7.30,{t:1.05,mat:materials.sandstoneAged,name:'Nectanebo_Vestibule_Heavy_Roof_PROBABLE'});
  roofSlab(0,-53.5,19.4,8.0,7.30,{t:1.05,mat:materials.sandstoneAged,name:'Nectanebo_Offering_Room_Heavy_Roof_PROBABLE'});
  roofSlab(-6.55,-67.0,4.85,16.0,7.25,{t:.92,mat:materials.sandstoneAged,name:'Nectanebo_Left_Side_Chamber_Roof_PROBABLE'});
  roofSlab(6.55,-67.0,4.85,16.0,7.25,{t:.92,mat:materials.sandstoneAged,name:'Nectanebo_Right_Side_Chamber_Roof_PROBABLE'});
}


function buildV18MuseumDetails() {
  const floorSections = [
    {z:82,w:24,d:24},{z:58,w:24,d:24},{z:26.5,w:24,d:39},{z:-.5,w:14,d:15},{z:-15.5,w:14,d:15},{z:-32,w:14,d:18},{z:-59,w:20,d:36},
  ];
  for (const section of floorSections) {
    for (let x = -section.w/2 + 3; x < section.w/2; x += 4.5) box(.025,.014,section.d,materials.floorJoint,x,.014,section.z,museumDetailGroup,`Floor_Joint_X_${section.z}_${x.toFixed(1)}`);
    for (let z = section.z-section.d/2+3; z < section.z+section.d/2; z += 4.5) box(section.w,.014,.025,materials.floorJoint,0,.015,z,museumDetailGroup,`Floor_Joint_Z_${section.z}_${z.toFixed(1)}`);
  }
  box(3.8,.012,190,materials.edgeWear,0,.014,18,museumDetailGroup,'Processional_Path_Wear');
  const patinaSections=[{z:82,w:21,d:20},{z:58,w:21,d:20},{z:26.5,w:21,d:34},{z:-.5,w:11.8,d:12},{z:-15.5,w:11.8,d:12},{z:-32,w:11.8,d:15},{z:-51,w:16.8,d:12},{z:-68,w:16.8,d:14}];
  patinaSections.forEach((a,i)=>{const stain=roundedBox(a.w,.018,a.d,.02,materials.floorPatina,((i%3)-1)*.26,.026,a.z+(i%2?.35:-.28),museumDetailGroup,`Floor_Patina_V18_${i}`);stain.rotation.y=(i%2?.012:-.014);});
  for(const [x,z,w,d] of[[-9.4,84,1.4,.7],[7.8,61,1.0,.55],[-5.4,1.8,.9,.5],[4.8,-17.2,1.1,.55],[-3.6,-31.5,.8,.45],[6.8,-52.5,1.0,.55]]) roundedBox(w,.10,d,.045,materials.sandstoneAged,x,.05,z,museumDetailGroup,`Chipped_Floor_Block_${x}_${z}`);
}
function buildTemple() {
  const { entrancePalm,zone24Palm,zone25Palm }=MODEL_DIMENSIONS.columns;
  box(44,1.2,204,materials.limestone,0,-.6,18,architectureGroup,'Temple_Platform');
  longWall(-20.1,18,200,{h:7.2,t:1.8,mat:materials.mudbrick});longWall(20.1,18,200,{h:7.2,t:1.8,mat:materials.mudbrick});
  crossWall(PLAN.eastEnclosureZ,42,{h:7.2,t:1.8,door:8,mat:materials.mudbrick,name:'Outer_Enclosure_East_INTERPRETIVE',archaeologicalId:23,certainty:CERTAINTY.INTERPRETIVE});
  crossWall(PLAN.westEnclosureZ,42,{h:7.2,t:1.8,door:5.5,mat:materials.mudbrick,name:'Outer_Enclosure_West_INTERPRETIVE',certainty:CERTAINTY.INTERPRETIVE});

  const leftPylon=taperedBox(14,18,7.5,.76,materials.sandstone);leftPylon.position.set(-10.5,9,PLAN.pylonZ);leftPylon.name='East_Pylon_Left_Arch23';
  const pylonAudit={archaeologicalId:23,certainty:CERTAINTY.INTERPRETIVE,title:'الصرح الشرقي — تمثيل تفسيري',sourceRefs:['Lange-Athinodorou 2022, Area A'],auditNote:'الصرح فُكك في العصور القديمة دون أن يترك أثرًا؛ الكتلة والارتفاع والكسوة والموضع التفصيلي في النموذج غير قابلة للتحقق ميدانيًا.'};
  leftPylon.userData={...pylonAudit};
  const rightPylon=taperedBox(14,18,7.5,.76,materials.sandstone);rightPylon.position.set(10.5,9,PLAN.pylonZ);rightPylon.name='East_Pylon_Right_Arch23';rightPylon.userData={...pylonAudit};architectureGroup.add(leftPylon,rightPylon);
  createEgyptianPortal({name:'East_Pylon_Portal_Arch23_INTERPRETIVE',archaeologicalId:23,z:PLAN.pylonZ,wallWidth:10,wallHeight:14.2,wallThickness:5.2,openingWidth:6.2,openingHeight:10.5,recessDepth:1.55,material:materials.granite,decorationLevel:'rich',certainty:CERTAINTY.INTERPRETIVE});
  column(-4.5,PLAN.palmColumnsZ,{h:entrancePalm.totalHeight,r:entrancePalm.radius,capital:'palm',material:materials.granite,detail:'hero',variant:'EA1065-West-Replica'});
  column(4.5,PLAN.palmColumnsZ,{h:entrancePalm.totalHeight,r:entrancePalm.radius,capital:'palm',material:materials.granite,detail:'hero',variant:'EA1065-East-Replica'});

  zoneSideWalls(24,PLAN.zone24EastZ,PLAN.zone24_25DividerZ,{h:8.8,t:2.05,mat:materials.limestoneAged,prefix:'Zone24_Monumental_Palm_Hall'});
  zoneSideWalls(24,PLAN.zone24_25DividerZ,PLAN.zone25WestZ,{h:8.15,t:2.15,mat:materials.sandstoneWarm,prefix:'Zone25_Dense_Palm_Vestibule'});
  zoneSideWalls(24,PLAN.zone25WestZ,PLAN.zone26WestZ,{h:8.35,t:2.25,mat:materials.granite,prefix:'HebSed_Zone26'});
  zoneSideWalls(14,PLAN.zone26WestZ,PLAN.zone27_28DividerZ,{h:7.95,t:2.25,mat:materials.limestoneAged,prefix:'Main_Hall_27_Heavy'});
  zoneSideWalls(14,PLAN.zone27_28DividerZ,PLAN.zone28WestZ,{h:7.85,t:2.35,mat:materials.sandstoneAged,prefix:'Main_Hall_28_Heavy'});
  zoneSideWalls(14,PLAN.zone28WestZ,PLAN.zone29WestZ,{h:6.65,t:2.05,mat:materials.sandstoneWarm,prefix:'Open_Hathor_Courtyard_29'});
  zoneSideWalls(20,PLAN.zone29WestZ,PLAN.zone30WestZ,{h:7.35,t:2.25,mat:materials.sandstoneAged,prefix:'Nectanebo_Multiroom_Complex_30'});

  crossWall(PLAN.zone24EastZ,24,{h:8.5,door:7.2,decorated:true,name:'Portal_Arch24',archaeologicalId:24});
  crossWall(PLAN.zone24_25DividerZ,24,{h:8.3,door:6.6,decorated:true,name:'Portal_Arch25',archaeologicalId:25});
  createEgyptianPortal({name:'Osorkon_II_Western_Gate_Arch26',archaeologicalId:26,z:PLAN.zone25WestZ,wallWidth:24,wallHeight:10.2,wallThickness:3.2,openingWidth:6.4,openingHeight:8.0,recessDepth:1.7,material:materials.granite,decorationLevel:'rich',certainty:CERTAINTY.PROBABLE});
  crossWall(PLAN.zone26WestZ,14,{h:7.8,door:5.5,decorated:true,name:'Portal_MainHall_Arch27',archaeologicalId:27});
  crossWall(PLAN.zone27_28DividerZ,14,{h:8.05,t:2.85,door:4.5,decorated:true,mat:materials.graniteDark,name:'Portal_InnerHall_Arch28_Heavy_Divider',archaeologicalId:28,recessDepth:1.55});
  crossWall(PLAN.zone28WestZ,14,{h:7.2,t:2.35,door:4.7,decorated:true,mat:materials.granite,name:'Portal_OpenHathorCourtyard_Arch29',archaeologicalId:29,recessDepth:1.45});
  createEgyptianPortal({name:'Nectanebo_II_Deep_Portal_Arch30',archaeologicalId:30,z:PLAN.zone29WestZ,wallWidth:20,wallHeight:8.3,wallThickness:3.4,openingWidth:4.4,openingHeight:6.1,recessDepth:2.0,material:materials.granite,decorationLevel:'rich',certainty:CERTAINTY.PROBABLE});

  // Zone 24: regular and expansive palmiform colonnade.
  columnGrid([-8,-2.7,2.7,8],[78,88],{h:zone24Palm.totalHeight,r:zone24Palm.radius,capital:'palm',material:materials.limestoneAged,detail:'standard',variant:'OsorkonI-Z24-Monumental'});
  // Zone 25: denser palmiform vestibule before the festival gate.
  columnGrid([-8,-4,0,4,8],[54,63],{h:zone25Palm.totalHeight,r:zone25Palm.radius,capital:'palm',material:materials.sandstoneWarm,detail:'standard',variant:'OsorkonI-Z25-Dense'});
  // Zone 26: four framing columns only; the central ritual axis stays open.
  columnGrid([-8.5,8.5],[16,37],{h:7.2,r:.45,capital:'simple',material:materials.granite,variant:'HebSed-Framing'});
  createHebSedFestivalKiosk();
  // Zones 27 and 28: simple stone columns, not generic plant capitals.
  columnGrid([-4.5,0,4.5],[-3,3],{h:7.12,r:.46,capital:'simple',material:materials.limestoneAged,variant:'MainHall27-Blocky'});
  columnGrid([-4.5,0,4.5],[-18,-12],{h:7.02,r:.40,capital:'simple',material:materials.sandstoneAged,variant:'MainHall28-Slender'});
  // Zone 29: four Hathoric columns in an OPEN courtyard, implemented exactly as requested by the doctor.
  // This is intentionally labelled INTERPRETIVE in the V18 documentation.
  column(-4.5,-28,{h:7.45,capital:'hathor',material:materials.granite,detail:'hero',northRotation:0,variant:'EA1107-North-Side-Attested'});
  column(4.5,-28,{h:7.45,capital:'hathor',material:materials.granite,detail:'hero',northRotation:0,variant:'EA1107-Reconstructed-02'});
  column(-4.5,-36,{h:7.45,capital:'hathor',material:materials.granite,detail:'hero',northRotation:0,variant:'EA1107-Reconstructed-03'});
  column(4.5,-36,{h:7.45,capital:'hathor',material:materials.granite,detail:'hero',northRotation:0,variant:'EA1107-Reconstructed-04'});
  createOpenHathorCourtyardDetails();

  // Zone 30: internal sequence — vestibule, offering room, side chambers, sanctuary/naos.
  const smallH=6.8;
  crossWall(-49,20,{h:smallH,t:2.45,door:4.2,decorated:true,mat:materials.sandstoneAged,name:'Nectanebo_Vestibule_Portal',archaeologicalId:30,recessDepth:1.55});
  crossWall(-57.5,20,{h:smallH,t:2.45,door:3.7,decorated:true,mat:materials.graniteDark,name:'Nectanebo_OfferingRoom_Portal',archaeologicalId:30,recessDepth:1.65});
  crossWall(-62.0,10.5,{h:smallH,t:2.15,door:3.25,decorated:true,mat:materials.sandstoneAged,name:'Nectanebo_Sanctuary_Approach_Portal',archaeologicalId:30,recessDepth:1.45});
  sideWallWithDoor(-4.15,-59.1,-75.2,-65.3,2.25,{h:smallH,t:1.65,prefix:'Nectanebo_Left_SideChamber_Door'});
  sideWallWithDoor(4.15,-59.1,-75.2,-68.3,2.25,{h:smallH,t:1.65,prefix:'Nectanebo_Right_SideChamber_Door'});
  wallSegment(-7.0,-59.9,6.0,1.65,smallH,materials.sandstoneAged);wallSegment(7.0,-59.9,6.0,1.65,smallH,materials.sandstoneAged);
  wallSegment(-7.0,-75.35,6.0,1.65,smallH,materials.sandstoneAged);wallSegment(7.0,-75.35,6.0,1.65,smallH,materials.sandstoneAged);
  wallSegment(-9.1,-67.6,1.8,15.5,smallH,materials.sandstoneAged);wallSegment(9.1,-67.6,1.8,15.5,smallH,materials.sandstoneAged);
  roundedBox(17.0,.24,6.5,.05,materials.limestoneAged,0,.12,-45.1,v6Group,'Nectanebo_Vestibule_Floor_Zone');
  roundedBox(17.0,.30,6.4,.05,materials.sandstoneWarm,0,.15,-53.4,v6Group,'Nectanebo_Offering_Room_Floor_Zone');
  roundedBox(7.0,.36,13.2,.05,materials.sandstoneAged,0,.18,-68.5,v6Group,'Nectanebo_Sanctuary_Central_Floor_Zone');
  createNectaneboNaos();createSanctuaryV18Enhancements();
  createPortalInscriptionProgram({name:'HebSed_Gate',z:44.95,openingWidth:6.4,wallHeight:10.2,face:'z-',archaeologicalId:26});
  createPortalInscriptionProgram({name:'Hathor_Courtyard_Gate',z:-22.05,openingWidth:4.7,wallHeight:7.2,face:'z+',archaeologicalId:29});
  createPortalInscriptionProgram({name:'Nectanebo_Deep_Gate',z:-40.05,openingWidth:4.4,wallHeight:8.3,face:'z+',archaeologicalId:30});

  for(const [x,z,h,source] of[[7.5,84,3.2,'Evidence associated with the eastern halls'],[-8.5,59,2.7,'Evidence associated with the Osorkon complex'],[5.2,-30,1.8,'Evidence associated with the Hathoric hall'],[-8.0,-52,1.6,'Evidence associated with the Nectanebo area']]){
    const rem=roundedBox(1.2,h,1.2,.12,materials.darkStone,x,h/2,z,existingRuinsGroup,`Evidence_Association_Marker_Not_InSitu_${x}_${z}`);
    rem.userData={certainty:CERTAINTY.INTERPRETIVE,title:'علامة ارتباط بالدليل — ليست بقايا في موضعها',archaeologicalId:null,sourceRefs:[source],sourceCertainty:CERTAINTY.ATTESTED,placementCertainty:CERTAINTY.INTERPRETIVE,auditNote:'هذه كتلة إرشادية داخل النموذج وليست مسحًا أو إحداثيًا لبقايا قائمة في هذا الموضع.'};
  }
  createEnclosureDecoration();createHistoricalEvidenceHotspots();createCanopusDecreeHotspot();
  createOfferingTable(0,-3,.48);createOfferingTable(0,-54,.42);
  buildColumnSuperstructure();
}


function buildEnvironment() {
  const sand = new THREE.MeshStandardMaterial({ color: 0xb79b69, roughness: 1 });
  const waterMat = new THREE.MeshPhysicalMaterial({ color: 0x2d7c80, roughness: .22, metalness: .04, transmission: .12, transparent: true, opacity: .91 });
  const ground = shadow(new THREE.Mesh(new THREE.PlaneGeometry(330,330),sand));ground.rotation.x=-Math.PI/2;ground.position.y=-1.3;environment.add(ground);
  for(const x of[-32,32]){const canal=shadow(new THREE.Mesh(new THREE.BoxGeometry(10,.8,235),waterMat));canal.position.set(x,-.55,18);environment.add(canal);}
  for(const x of[-25.5,-38.5,25.5,38.5])box(1.4,2.2,235,materials.mudbrick,x,-.05,18,environment);
  for(let z=-90;z<=135;z+=22){createPalm(-48-Math.sin(z*.1)*2.2,z,.58);createPalm(48+Math.cos(z*.11)*2.2,z,.60);}
  for(const [x,z] of[[-15,125],[15,125],[-22,112],[22,112]])createPalm(x,z,.58);
}


const zoneData = [
  {id:1,archaeologicalId:23,title:'الصرح والمدخل الشرقي',z:108,y:21,type:'مدخل وصرح تفسيري',certainty:CERTAINTY.INTERPRETIVE,confidence:'INTERPRETIVE — الصرح فُكك دون أثر؛ الشكل والإحداثي التفصيلي غير مؤكدين',description:'يوضح النموذج بداية المحور الشرقي فقط. تقرير الحفائر الحديث يذكر أن الصرح فُكك تمامًا في العصور القديمة دون أن يترك أثرًا، وأن السور الخارجي لم يُحدد؛ لذلك لا يمثل الشكل الحالي قياسًا أثريًا.',source:'Lange-Athinodorou 2022، تقرير حفائر Area A؛ Naville 1891، اللوحة LIV للتسلسل العام.',sourceUrl:'https://www.researchgate.net/publication/368720962_Lange-Athinodorou_Eva_2022_Preliminary_report_on_the_excavation_in_the_precinct_of_the_temple_of_Bastet_in_BubastisTell_Basta_Area_A_seasons_2009-2017_In_Wahby_Ayman_and_Penelope_Wilson_eds_The_Delta_',note:'ممنوع استخدام هذا الصرح أو السور كدليل على شكل أو أبعاد أو إحداثيات أثرية مؤكدة.'},
  {id:2,archaeologicalId:24,title:'صالة أعمدة أوسركون الأول',z:82,y:13,type:'صالة أعمدة نخيلية',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — القاعة والنوع مؤيدان؛ الشبكة والأبعاد الدقيقة إعادة بناء',description:'القسم الأول من مجمع 24–25. وجود منطقة مدخل/صالة شرقية مؤيد بالمخطط العام والقطع، لكن غلاف 48 × 24 م وشبكة الأعمدة في النسخة الحالية مواصفة المشروع وليسا رفعًا أثريًا منشورًا تم التحقق منه.',source:'Naville 1891، اللوحة LIV؛ British Museum EA1065 للمقارنة النوعية.',sourceUrl:'https://digi.ub.uni-heidelberg.de/diglit/naville1891',note:'نوع العمود مؤيد أثريًا؛ كل نسخة رقمية وموضعها الحالي PROBABLE/INTERPRETIVE.'},
  {id:3,archaeologicalId:25,title:'بهو أعمدة أوسركون الأول',z:58,y:12,type:'بهو نخلي أكثر كثافة',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — التقسيم والكثافة والحدود التفصيلية غير مثبتة إحداثيًا',description:'القسم الثاني من مجمع 24–25. الفصل الحالي بين 24 و25 وكثافة الأعمدة وإحداثيات الجدران إعادة بناء تلبي مخطط المشروع، وليست تحديدًا أثريًا يقينيًا.',source:'Naville 1891، اللوحة LIV؛ مخطط التعديلات بوصفه مواصفة تصميم لا مصدر حفائر.',sourceUrl:'https://digi.ub.uni-heidelberg.de/diglit/naville1891',note:'الرسم النظيف داخل التعديلات.docx خطة مشروع حديثة، وليس لوحة حفائر.'},
  {id:4,archaeologicalId:26,subspace:'western-gate',title:'البوابة الغربية لصالة حب سد',z:46,y:14,type:'بوابة احتفالية غائرة',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — الموضوع والكتل موثقة؛ الارتفاع والتركيب والموضع الجداري مرجحة',description:'البوابة الرقمية تستند إلى كتل ومشاهد عيد حب سد المنشورة. لا تُعامل واجهتها الكاملة أو توزيع كل نقش عليها كإعادة تركيب يقينية.',source:'Louvre E10592؛ Penn Museum E225؛ Naville 1891/1892؛ شكل 18.',sourceUrl:'https://collections.louvre.fr/ark:/53355/cl010010821',note:'المشهد الأثري ATTESTED؛ موضعه وتجميع البوابة داخل النموذج PROBABLE.'},
  {id:5,archaeologicalId:26,title:'صالة عيد حب سد لأوسركون الثاني',z:26.5,y:12,type:'صالة احتفالية 39 × 24 م في النموذج',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — هوية البرنامج قوية؛ التخطيط التفصيلي والقياس الحالي غير يقينيين',description:'ارتباط المجمع بأوسركون الثاني وبرنامج حب سد مؤيد بالقطع المنشورة. الأبعاد 39 × 24 م، الأعمدة الأربعة، المقصورة الجانبية، السقف ومواضع النقوش هي إعادة بناء المشروع.',source:'Louvre E10592؛ Penn Museum E225؛ Naville 1891/1892؛ الأشكال 18 و19.',sourceUrl:'https://www.penn.museum/collections/object/319075',note:'لا يوجد مصدر واحد يثبت كل عناصر التكوين الرقمي الحالي معًا.'},
  {id:6,archaeologicalId:27,title:'الصالة الرئيسية 27',z:-.5,y:11,type:'صالة حجرية مستقلة في مخطط المشروع',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — الفصل 27/28 والشبكة والسقف تفاصيل معاد بناؤها',description:'يمثل النصف الشرقي من المساحة المخصصة للصالتين 27 و28 في مخطط المشروع. الفصل الداخلي والأعمدة الحجرية والسقف الثقيل أضيفت كحل معماري مرجح، ولا تتوافر إحداثيات حفائر تثبت كل عنصر.',source:'مخطط التعديلات بوصفه مواصفة تصميم؛ Naville 1891 للتسلسل العام فقط.',sourceUrl:'https://digi.ub.uni-heidelberg.de/diglit/naville1891',note:'موضع الصالة داخل التسلسل مرجح؛ هندستها الدقيقة غير مؤكدة.'},
  {id:7,archaeologicalId:28,title:'الصالة الداخلية 28',z:-15.5,y:11,type:'صالة حجرية داخلية في مخطط المشروع',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — الحدود والأعمدة والسقف والإضاءة إعادة بناء',description:'يمثل النصف الغربي من مساحة 27–28 في مخطط المشروع. لا تثبت اللوحة الأثرية العامة خط الفصل الحالي أو تفاصيل التغطية والإنارة.',source:'مخطط التعديلات بوصفه مواصفة تصميم؛ Naville 1891 للتسلسل العام فقط.',sourceUrl:'https://digi.ub.uni-heidelberg.de/diglit/naville1891',note:'هذه تجربة فراغية علمية مرجحة وليست استنساخًا يقينيًا لبقايا قائمة.'},
  {id:8,archaeologicalId:29,title:'الفناء الحتحوري المفتوح',z:-32,y:10,type:'فناء مستقل مفتوح من أعلى بأربعة أعمدة حتحورية',certainty:CERTAINTY.INTERPRETIVE,confidence:'INTERPRETIVE — نُفذ مفتوحًا من أعلى تنفيذًا مباشرًا لملاحظة الدكتور',description:'تظهر المنطقة 29 الآن كفناء مستقل ومكشوف للسماء، تحيط به جدران واضحة وتقوم داخله أربعة أعمدة حتحورية مميزة من الجرانيت الأحمر. أزيل السقف والكمرات نهائيًا كي يُقرأ الفناء بصريًا فور دخول الجولة.',source:'ملاحظات الدكتور على فيديو الجولة؛ EA1107 مرجع بصري للتاج الحتحوري.',sourceUrl:'https://www.britishmuseum.org/collection/object/Y_EA1107',note:'فتح الفناء قرار تصميمي مطلوب من الدكتور، وموسوم داخل المشروع بوضوح كإعادة بناء تفسيرية.'},
  {id:9,archaeologicalId:30,title:'مجمع نختنبو الثاني متعدد الحجرات',z:-52,y:10,type:'دهليز وغرفة قرابين وممرات وحجرات جانبية وقدس أقداس',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE — الارتباط بنختنبو مؤيد؛ تسلسل الحجرات وأبعادها غير مؤكدة بالكامل',description:'أُعيد تنظيم الجزء 30 بصريًا ليُقرأ كمجمع كامل: دهليز مستقل، غرفة قرابين، بوابة اقتراب داخلية، ممر مركزي، مدخلان واضحان للحجرتين الجانبيتين، ثم حجرة الناووس وقدس الأقداس. اختلاف الأرضيات والأسقف والعتبات يوضح الانتقال بين الفراغات.',source:'Naville 1891، اللوحة LIV؛ British Museum EA1078–EA1080؛ أشكال التعديلات.',sourceUrl:'https://www.britishmuseum.org/collection/object/Y_EA1079',note:'لا تُقرأ الحجرات الرقمية كخريطة إحداثية للحفائر.'},
  {id:10,archaeologicalId:30,subspace:'sanctuary',title:'قدس الأقداس وناووس باستت',z:-69,y:12,type:'حجرة وناووس معاد تركيبهما',certainty:CERTAINTY.PROBABLE,confidence:'PROBABLE/INTERPRETIVE — القطع موثقة لكن إعادة تركيب الناووس الرسمية موصوفة بأنها إشكالية',description:'EA1078–EA1080 أجزاء أصلية من ناووس جرانيت لنختنبو من تل بسطة. الشكل الكامل والأبعاد والموضع الدقيق للناووس داخل الحجرة غير محفوظة يقينيًا؛ تمثال باستت والتأثيث الطقسي تفسيران صريحان.',source:'British Museum EA1078، EA1079، EA1080؛ الأشكال 33 و34 و37 و38 و45.',sourceUrl:'https://www.britishmuseum.org/collection/object/Y_EA1079',note:'المتحف البريطاني يسجل ارتباكًا في السجلات ويصف إعادة التركيب المنشورة بأنها problematic.'},

];

const ZONE_DATA_EN = Object.freeze({
  1:{title:'Eastern Pylon and Entrance',type:'Interpretive entrance and pylon',confidence:'INTERPRETIVE — the pylon was dismantled without leaving a trace; its form and precise coordinates are uncertain',description:'The model indicates only the beginning of the eastern axis. The modern excavation report states that the pylon was completely dismantled in antiquity without leaving a trace and that the outer enclosure wall was not identified. The present form is therefore not an archaeological measurement.',source:'Lange-Athinodorou 2022, Area A excavation report; Naville 1891, Plate LIV for the general sequence.',note:'This pylon and enclosure must not be used as evidence for an archaeologically certain form, dimensions, or coordinates.'},
  2:{title:'Osorkon I Column Hall',type:'Palmiform hypostyle hall',confidence:'PROBABLE — the hall and column type are supported; the grid and exact dimensions are reconstructed',description:'The first part of complex 24–25. An eastern entrance or hall zone is supported by the general plan and objects, but the 48 × 24 m envelope and the current column grid are project specifications rather than a verified published survey.',source:'Naville 1891, Plate LIV; British Museum EA1065 for typological comparison.',note:'The column type is archaeologically supported; every digital copy and its current position are PROBABLE/INTERPRETIVE.'},
  3:{title:'Osorkon I Column Vestibule',type:'Denser palmiform vestibule',confidence:'PROBABLE — subdivision, density, and detailed boundaries are not fixed by archaeological coordinates',description:'The second part of complex 24–25. The current division between 24 and 25, the column density, and wall coordinates are reconstructions serving the project plan and are not certain archaeological identifications.',source:'Naville 1891, Plate LIV; the amendment plan is a design specification, not an excavation source.',note:'The clean drawing in the amendment document is a modern project plan, not an excavation plate.'},
  4:{title:'Western Gateway of the Heb-Sed Hall',type:'Recessed ceremonial gateway',confidence:'PROBABLE — the subject and blocks are attested; height, assembly, and wall placement are probable',description:'The digital gateway is based on published blocks and Heb-Sed scenes. Its complete façade and the distribution of every relief should not be treated as a certain reconstruction.',source:'Louvre E10592; Penn Museum E225; Naville 1891/1892; Figure 18.',note:'The archaeological scene is ATTESTED; its position and gateway assembly in the model are PROBABLE.'},
  5:{title:'Osorkon II Heb-Sed Festival Hall',type:'39 × 24 m ceremonial hall in the model',confidence:'PROBABLE — the program identity is strong; the detailed plan and current dimensions are uncertain',description:'The association with Osorkon II and the Heb-Sed program is supported by published objects. The 39 × 24 m dimensions, four columns, side kiosk, roof, and relief positions are project reconstructions.',source:'Louvre E10592; Penn Museum E225; Naville 1891/1892; Figures 18 and 19.',note:'No single source establishes every element of the present digital composition together.'},
  6:{title:'Main Hall 27',type:'Independent stone hall in the project plan',confidence:'PROBABLE — the 27/28 division, column grid, and roof are reconstructed details',description:'This represents the eastern half of the area assigned to halls 27 and 28 in the project plan. The internal division, stone columns, and heavy roof were added as a probable architectural solution; no excavation coordinates establish every element.',source:'Amendment plan as a design specification; Naville 1891 only for the general sequence.',note:'The hall’s position in the sequence is probable; its exact geometry is uncertain.'},
  7:{title:'Inner Hall 28',type:'Inner stone hall in the project plan',confidence:'PROBABLE — boundaries, columns, roof, and lighting are reconstructed',description:'This represents the western half of the 27–28 area in the project plan. The general archaeological plate does not establish the present dividing line or the details of roofing and lighting.',source:'Amendment plan as a design specification; Naville 1891 only for the general sequence.',note:'This is a probable scholarly spatial experience, not a certain replica of standing remains.'},
  8:{title:'Open Hathoric Courtyard',type:'Independent open-air courtyard with four Hathoric columns',confidence:'INTERPRETIVE — implemented as open to the sky in direct response to the review note',description:'Zone 29 is presented as an independent courtyard open to the sky, enclosed by clear walls and containing four distinctive red-granite Hathoric columns. The roof and beams were removed so the courtyard reads immediately on entering the tour.',source:'Review notes on the tour video; EA1107 as the visual reference for the Hathoric capital.',note:'Opening the courtyard is a requested design decision and is explicitly marked in the project as an interpretive reconstruction.'},
  9:{title:'Nectanebo II Multi-Room Complex',type:'Vestibule, offering room, passages, side chambers, and sanctuary',confidence:'PROBABLE — association with Nectanebo is supported; the room sequence and dimensions are not fully certain',description:'Area 30 was reorganized visually as a complete complex: an independent vestibule, offering room, inner approach gateway, central passage, two clear side-chamber entrances, and finally the naos chamber and sanctuary. Changes in floors, roofs, and thresholds clarify movement between spaces.',source:'Naville 1891, Plate LIV; British Museum EA1078–EA1080; amendment figures.',note:'The digital rooms must not be read as an excavation coordinate map.'},
  10:{title:'Sanctuary and Naos of Bastet',type:'Reconstructed chamber and naos',confidence:'PROBABLE/INTERPRETIVE — the fragments are attested, but the official naos reconstruction is described as problematic',description:'EA1078–EA1080 are original fragments of a granite naos of Nectanebo from Tell Basta. The complete form, dimensions, and exact position inside the room are not preserved with certainty; the Bastet statue and ritual furnishings are explicit interpretations.',source:'British Museum EA1078, EA1079 and EA1080; Figures 33, 34, 37, 38 and 45.',note:'The British Museum records documentation confusion and describes the published reconstruction as problematic.'}
});
for(const zone of zoneData) zone.en=ZONE_DATA_EN[zone.id];

function markerTexture(number) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const ctx = c.getContext('2d'); ctx.clearRect(0, 0, 256, 256);
  ctx.beginPath(); ctx.arc(128,128,106,0,Math.PI*2); ctx.fillStyle='#d8ae58'; ctx.fill(); ctx.lineWidth=16; ctx.strokeStyle='#13231f'; ctx.stroke();
  ctx.fillStyle='#12211e'; ctx.font='bold 108px Segoe UI, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(String(number),128,136);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const markerSprites = [];
for (const zone of zoneData) {
  if (zone.subspace) continue;
  const material = new THREE.SpriteMaterial({ map:markerTexture(zone.archaeologicalId), transparent:true, depthTest:false });
  const sprite = new THREE.Sprite(material); sprite.position.set(0,zone.y,zone.z); sprite.scale.set(5.2,5.2,1); sprite.renderOrder=20; sprite.userData.zone=zone; sprite.userData.baseScale=5.2; markersGroup.add(sprite); markerSprites.push(sprite);
}

const infoPanel = document.getElementById('info-panel');
const focusObjectBtn = document.getElementById('focus-object-btn');
const returnViewBtn = document.getElementById('return-view-btn');
const sourceLinkBtn = document.getElementById('source-link-btn');
const hoverLabel = document.getElementById('hover-label');
const walkCrosshair = document.getElementById('walk-crosshair');
const titleEn = document.getElementById('zone-title-en');
const previewFigure = document.getElementById('info-preview');
const previewImage = document.getElementById('info-preview-img');
const canopusZoomBtn=document.getElementById('canopus-zoom-btn');
const canopusScriptBtn=document.getElementById('canopus-script-btn');
const canopusModal=document.getElementById('canopus-modal');
const canopusModalClose=document.getElementById('canopus-modal-close');
const canopusModalImage=document.getElementById('canopus-modal-image');
let hoveredItem = null, selectedItem = null, focusReturnState = null;
const edgeCache = new WeakMap();
const hoverLineMaterial = new THREE.LineBasicMaterial({ color:0xefd497, transparent:true, opacity:.72, depthTest:true });
const selectedLineMaterial = new THREE.LineBasicMaterial({ color:0x56b98a, transparent:true, opacity:.88, depthTest:true });
let hoverOutline = null, selectedOutline = null;
function getEdgeGeometry(object){
  if(edgeCache.has(object)) return edgeCache.get(object);
  const geometry = object.geometry ? new THREE.EdgesGeometry(object.geometry, 28) : null;
  if(geometry) edgeCache.set(object, geometry); return geometry;
}
function replaceOutline(current, object, material){
  if(current){ scene.remove(current); current = null; }
  if(!object?.isMesh || !object.geometry) return null;
  const edges = getEdgeGeometry(object); if(!edges) return null;
  const line = new THREE.LineSegments(edges, material); line.matrixAutoUpdate = false; line.matrix.copy(object.matrixWorld); line.renderOrder = 40; scene.add(line); return line;
}
function refreshOutline(line, object){ if(line && object){ object.updateWorldMatrix(true,false); line.matrix.copy(object.matrixWorld); } }
function clearSelection(){ selectedItem=null; if(selectedOutline){scene.remove(selectedOutline);selectedOutline=null;} focusObjectBtn.classList.add('hidden'); returnViewBtn.classList.toggle('hidden',!focusReturnState); }
function hideHoverLabel(){ hoverLabel.classList.add('hidden'); }
function updateHoverLabel(text,x,y){ if(!text){hideHoverLabel();return;} hoverLabel.textContent=text; hoverLabel.style.left=`${x}px`; hoverLabel.style.top=`${y}px`; hoverLabel.classList.remove('hidden'); }
function setHoveredItem(item,event){ hoveredItem=item; const object=item?.focusObject||item?.object||null; if(hoverOutline){scene.remove(hoverOutline);hoverOutline=null;} if(object&&object!==selectedItem) hoverOutline=replaceOutline(null,object,hoverLineMaterial); if(item?.label) updateHoverLabel(item.label,event.clientX,event.clientY); else hideHoverLabel(); }
function setSelectedObject(object){ selectedItem=object?.isMesh?object:null; if(selectedOutline){scene.remove(selectedOutline);selectedOutline=null;} if(selectedItem) selectedOutline=replaceOutline(null,selectedItem,selectedLineMaterial); focusObjectBtn.classList.toggle('hidden',!selectedItem); returnViewBtn.classList.toggle('hidden',!focusReturnState); }
function confidenceGrade(text=''){ return /موثق مباشرة|مرتفع|attested/i.test(text)?'attested':/تفسيري|interpretive|إعادة بناء/i.test(text)?'interpretive':'contextual'; }
function setOptionalRow(id,value){ const el=document.getElementById(id); const row=el?.parentElement; if(!el||!row)return; el.textContent=value||''; row.style.display=value?'grid':'none'; }
function renderInfo(payload){
  const data=localizeRecord(payload),{badge='',title='',englishTitle='',description='',confidence='',type='',material='',period='',source='',sourceUrl='',image='',note='',object=null,special=''}=data;
  const badgeEl=document.getElementById('zone-badge');badgeEl.textContent=badge;badgeEl.dataset.grade=confidenceGrade(confidence);
  document.getElementById('zone-title').textContent=title;titleEn.textContent=englishTitle;titleEn.classList.toggle('hidden',!englishTitle);
  document.getElementById('zone-description').textContent=description;document.getElementById('zone-confidence').textContent=confidence;document.getElementById('zone-type').textContent=type;
  setOptionalRow('zone-period',period);setOptionalRow('zone-material',material);document.getElementById('zone-source').textContent=source||t('info.unspecified');
  sourceLinkBtn.classList.toggle('hidden',!sourceUrl);if(sourceUrl)sourceLinkBtn.href=sourceUrl;else sourceLinkBtn.removeAttribute('href');
  previewFigure.classList.toggle('hidden',!image);if(image)previewImage.src=image;else previewImage.removeAttribute('src');
  previewImage.alt=title?`${t('info.visualRef')}: ${title}`:t('info.imageAlt');
  const isCanopus=special==='canopus';canopusZoomBtn?.classList.toggle('hidden',!isCanopus);canopusScriptBtn?.classList.toggle('hidden',!isCanopus);
  const placement=document.getElementById('placement-note');placement.textContent=note;placement.style.display=note?'block':'none';setSelectedObject(object);infoPanel.classList.add('open');
}
function setInfo(payload){currentInfoPayload=payload;renderInfo(payload);}
function openZone(zone){
  const badge=t(zone.subspace?'zone.inside':'zone.label',zone);
  const badgeAr=I18N.ar[zone.subspace?'zone.inside':'zone.label'].replace('{id}',zone.id).replace('{archaeologicalId}',zone.archaeologicalId);
  const badgeEn=I18N.en[zone.subspace?'zone.inside':'zone.label'].replace('{id}',zone.id).replace('{archaeologicalId}',zone.archaeologicalId);
  setInfo({...zone,badge:badgeAr,en:{...(zone.en||{}),badge:badgeEn},object:null});
}
function openRelief(mesh){
  const d=mesh.userData,a=assetById.get(d.sourceId),isAttested=/attested|موثق/i.test(d.confidence),isContextual=/contextual|سياقي/i.test(d.confidence);
  const gradeAr=isAttested?I18N.ar['relief.attested']:isContextual?I18N.ar['relief.contextual']:I18N.ar['relief.interpretive'];
  const gradeEn=isAttested?I18N.en['relief.attested']:isContextual?I18N.en['relief.contextual']:I18N.en['relief.interpretive'];
  setInfo({badge:I18N.ar['relief.badge'].replace('{zone}',d.zone??'?'),title:d.title,englishTitle:a?.title||'',description:I18N.ar['relief.description'],confidence:`${gradeAr}: ${d.confidence}`,type:I18N.ar['relief.type'],material:a?.stoneType||I18N.ar['relief.material'],period:I18N.ar['relief.period'],source:d.source,image:d.image||a?.color,note:d.note,object:mesh,en:{badge:I18N.en['relief.badge'].replace('{zone}',d.zone??'?'),title:a?.title||d.title,description:I18N.en['relief.description'],confidence:`${gradeEn}: ${d.confidence}`,type:I18N.en['relief.type'],material:a?.stoneType||I18N.en['relief.material'],period:I18N.en['relief.period'],source:d.source,note:`Direct source: ${d.source}; the archaeological scene is attested, while the panel's present placement may be probable.`}});
}
function openColumn(mesh){
  const d=mesh.userData.columnInfo;if(!d)return;const isPalm=/EA1065|نخلي/i.test(d.title),isHathor=/EA1107|حتحور/i.test(d.title),key=d.id||(/عمود حجري بسيط/i.test(d.title)?'simple':'');
  const en=COLUMN_INFO_EN[key]||COLUMN_INFO_EN.simple;
  setInfo({badge:I18N.ar['column.badge'],title:d.title,englishTitle:d.type,description:`${d.date}. ${d.rulers}. الأبعاد: ${d.dimensions}.`,confidence:d.confidence,type:d.type,material:d.material,period:d.date,source:d.source,sourceUrl:isPalm?'https://www.britishmuseum.org/collection/object/Y_EA1065':isHathor?'https://www.britishmuseum.org/collection/object/Y_EA1107':'',image:'',note:d.note,object:mesh,en:{badge:I18N.en['column.badge'],title:en.title,description:`${en.date}. ${en.rulers}. Dimensions: ${en.dimensions}.`,confidence:en.confidence,type:en.type,material:en.material,period:en.date,source:en.source,note:en.note}});
}
function openV18Object(mesh){
  const info=findV18ObjectInfo(mesh);if(!info)return false;
  setInfo({...info,note:info.note||I18N.ar['info.defaultNote'],en:{...(info.en||{}),note:info.en?.note||I18N.en['info.defaultNote']},object:mesh});return true;
}
function openCanopusModal({zoom=false}={}){if(!canopusModal)return;canopusModal.classList.add('open');canopusModalImage?.classList.toggle('zoomed',zoom);}
canopusZoomBtn?.addEventListener('click',()=>openCanopusModal({zoom:true}));
canopusScriptBtn?.addEventListener('click',()=>openCanopusModal({zoom:false}));
canopusModalClose?.addEventListener('click',()=>canopusModal?.classList.remove('open'));
canopusModal?.addEventListener('click',e=>{if(e.target===canopusModal)canopusModal.classList.remove('open');});
canopusModalImage?.addEventListener('click',()=>canopusModalImage.classList.toggle('zoomed'));
document.addEventListener('keydown',e=>{if(e.code==='Escape'&&canopusModal?.classList.contains('open'))canopusModal.classList.remove('open');});
previewImage?.addEventListener('load',()=>previewFigure.classList.remove('hidden'));
previewImage?.addEventListener('error',()=>{previewFigure.classList.add('hidden');previewImage.removeAttribute('src');});

const raycastMeshes=[]; const reliefSet=new Set(), columnSet=new Set();
const RAY_CELL=22; const raycastGrid=new Map();
function gridKey(x,z){return `${Math.floor(x/RAY_CELL)},${Math.floor(z/RAY_CELL)}`;}
function addToRayGrid(object){const b=new THREE.Box3().setFromObject(object);for(let ix=Math.floor(b.min.x/RAY_CELL);ix<=Math.floor(b.max.x/RAY_CELL);ix++)for(let iz=Math.floor(b.min.z/RAY_CELL);iz<=Math.floor(b.max.z/RAY_CELL);iz++){const k=`${ix},${iz}`;if(!raycastGrid.has(k))raycastGrid.set(k,[]);raycastGrid.get(k).push(object);}}
function nearbyRaycastMeshes(position){const found=new Set();const cx=Math.floor(position.x/RAY_CELL),cz=Math.floor(position.z/RAY_CELL);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const obj of raycastGrid.get(`${cx+dx},${cz+dz}`)||[])found.add(obj);return [...found];}
function registerV18InteractiveObjects(){
  interactiveV18Objects.length=0;raycastMeshes.length=0;raycastGrid.clear();reliefSet.clear();columnSet.clear();
  for(const obj of interactiveReliefs) reliefSet.add(obj); for(const obj of interactiveColumns) columnSet.add(obj);
  templeModel.updateMatrixWorld(true); templeModel.traverse((obj)=>{if(!obj.isMesh||!obj.geometry||!isEffectivelyVisible(obj))return;raycastMeshes.push(obj);addToRayGrid(obj);const info=findV18ObjectInfo(obj);if(info){obj.userData.v18Info=info;interactiveV18Objects.push(obj);}});
}

document.getElementById('close-info').addEventListener('click',()=>{if(focusReturnState)returnToPreviousView();infoPanel.classList.remove('open');currentInfoPayload=null;clearSelection();clearWalkInput(false);});
const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();
function updatePointer(event){pointer.x=(event.clientX/window.innerWidth)*2-1;pointer.y=-(event.clientY/window.innerHeight)*2+1;raycaster.far=walkState?.active?18:1200;raycaster.setFromCamera(pointer,camera);}
function kindForObject(object){if(reliefSet.has(object))return'relief';if(columnSet.has(object)||object.userData?.columnInfo)return'column';if(findV18ObjectInfo(object))return'generic';return null;}
function deriveLabel(kind,object){if(kind==='relief'){const d=object.userData||{},a=assetById.get(d.sourceId);return currentLanguage==='en'?(a?.title||t('label.relief')):(d.title||t('label.relief'));}if(kind==='column'){const d=object.userData?.columnInfo;if(!d)return t('label.column');const key=d.id||(/عمود حجري بسيط/i.test(d.title)?'simple':'');return currentLanguage==='en'?(COLUMN_INFO_EN[key]?.title||t('label.column')):d.title;}const info=findV18ObjectInfo(object);return info?localizeRecord(info).title:t('label.architecture');}
function getInteractiveCandidateFromCurrentRay(){
  const targets=walkState?.active?nearbyRaycastMeshes(camera.position):raycastMeshes;const hits=raycaster.intersectObjects(targets,false);
  for(const hit of hits){if(walkState?.active&&hit.distance>17)return null;const kind=kindForObject(hit.object);if(kind)return{kind,hit,object:hit.object,focusObject:hit.object,label:deriveLabel(kind,hit.object)};return null;}
  if(!walkState?.active){const marker=raycaster.intersectObjects(markerSprites,false)[0];if(marker?.object?.userData?.zone){const zone=marker.object.userData.zone;return{kind:'marker',hit:marker,object:marker.object,focusObject:null,label:localizeRecord(zone).title};}}
  return null;
}
function inspectCandidate(candidate){if(!candidate){infoPanel.classList.remove('open');currentInfoPayload=null;clearSelection();return;}if(candidate.kind==='relief')return openRelief(candidate.object);if(candidate.kind==='column')return openColumn(candidate.object);if(candidate.kind==='generic')return openV18Object(candidate.object);if(candidate.kind==='marker')return openZone(candidate.object.userData.zone);}
renderer.domElement.addEventListener('pointermove',(event)=>{if(walkState?.active&&walkState.dragging)return;updatePointer(event);const candidate=getInteractiveCandidateFromCurrentRay();setHoveredItem(candidate,event);renderer.domElement.style.cursor=candidate?'pointer':(walkState?.active?'crosshair':'grab');});
renderer.domElement.addEventListener('pointerleave',()=>{if(hoverOutline){scene.remove(hoverOutline);hoverOutline=null;}hideHoverLabel();});
renderer.domElement.addEventListener('click',(event)=>{
  if(walkState?.active&&(walkState.dragging||walkState.didLookDrag)){walkState.didLookDrag=false;return;}
  updatePointer(event);inspectCandidate(getInteractiveCandidateFromCurrentRay());
});

const cameraPresets = {
  overview:{position:new THREE.Vector3(118,86,176),target:new THREE.Vector3(0,6.5,18)},
  osorkon:{position:new THREE.Vector3(26,16,70),target:new THREE.Vector3(0,5.2,46)},
  top:{position:new THREE.Vector3(0,220,18),target:new THREE.Vector3(0,0,18)},
  entrance:{position:new THREE.Vector3(38,22,151),target:new THREE.Vector3(0,6.8,106)},
  hebsed:{position:new THREE.Vector3(9.6,7.8,48.5),target:new THREE.Vector3(-2.8,4.5,26.5)},
  hathor:{position:new THREE.Vector3(1.8,5.6,-25.0),target:new THREE.Vector3(0,4.6,-32.8)},
  sanctuary:{position:new THREE.Vector3(0,2.15,-64.1),target:new THREE.Vector3(0,2.25,MODEL_DIMENSIONS.naos.centerZ)},
};
let cameraTween = null;
let qaCameraActive=false;
function flyCamera(key) { const p=cameraPresets[key]; if(!p)return; qaCameraActive=false;guidedTourState.finalHold=false;cameraTween={fromP:camera.position.clone(),toP:p.position.clone(),fromT:controls.target.clone(),toT:p.target.clone(),fromFov:camera.fov,toFov:45,start:performance.now(),duration:1100}; }
document.querySelectorAll('[data-camera]').forEach((btn) => btn.addEventListener('click', () => flyCamera(btn.dataset.camera)));
const guidedTourStops=[
  ['approach-wide',[0,7.2,154],[0,6.6,108],3400,2600,1.10],['east-pylon-pause',[0,5.8,128],[0,7.0,108],3100,2800,1.07],['palmiform-columns',[0,3.8,104],[0,5.7,98],2600,2100,1.04],
  ['zone24-monumental',[0,4.15,101],[0,5.55,84],2700,2200,1.00,55],['zone25-dense',[1.65,3.95,68.8],[-.8,4.85,58],2700,2200,.96],['western-gate-pause',[1.4,4.25,54.8],[0,5.55,46],3300,3000,.93],
  ['heb-sed-hall',[1.2,3.85,40.8],[-2.4,4.45,26.5],3000,2400,.90],['main-hall-27',[2.25,3.6,0],[2.25,4.3,6.0],2800,2200,.86,72],['divider-27-28',[2.2,3.55,0],[.6,5.2,-8.0],3200,2500,.84,74],['main-hall-28',[2.25,3.5,-15.0],[0,4.0,-22.2],2800,2300,.82,74],
  ['hathor-gate-pause',[1.0,3.85,-19.4],[0,5.05,-23],3100,2600,.94],['open-hathor-courtyard',[1.0,4.65,-25.2],[0,4.7,-33],3000,3200,1.03],['nectanebo-gate-pause',[1.1,3.85,-36.2],[0,4.95,-41],3400,3000,.82],
  ['vestibule',[.8,3.05,-44.2],[0,3.45,-48.5],2800,2100,.79],['offering-room',[-.7,2.90,-51.6],[0,3.30,-56.5],2900,2300,.76],['left-side-chamber',[-7.65,2.45,-65.3],[-3.35,3.10,-65.3],3000,2400,.82,64],['right-side-chamber',[7.65,2.45,-68.3],[3.35,3.05,-68.3],3000,2400,.82,64],
  ['sanctuary-threshold',[0,2.35,-59.4],[0,2.65,-66.2],3400,2800,.80,45],['star-ceiling',[0,3.6,-67.0],[0,8.45,-69.2],3000,2600,1.10,55],['naos-final',[0,1.88,-62.2],[0,2.18,MODEL_DIMENSIONS.naos.centerZ],3600,6500,.94,42],
].map(([id,p,t,moveDuration,holdDuration,exposure,fov=45])=>({id,position:new THREE.Vector3(...p),target:new THREE.Vector3(...t),moveDuration,holdDuration,exposure,fov}));
guidedTourStops.find((stop)=>stop.id==='main-hall-28').via=[new THREE.Vector3(.8,3.5,-6.2),new THREE.Vector3(.8,3.5,-10.2),new THREE.Vector3(2.25,3.5,-10.8)];
guidedTourStops.find((stop)=>stop.id==='left-side-chamber').via=[new THREE.Vector3(0,2.5,-61.0),new THREE.Vector3(0,2.4,-65.3),new THREE.Vector3(-4.95,2.3,-65.3)];
guidedTourStops.find((stop)=>stop.id==='right-side-chamber').via=[new THREE.Vector3(-5.25,2.3,-65.3),new THREE.Vector3(-4.15,2.3,-65.3),new THREE.Vector3(-3.0,2.4,-65.3),new THREE.Vector3(-3.0,2.4,-64.0),new THREE.Vector3(0,2.4,-64.0),new THREE.Vector3(3.0,2.4,-64.0),new THREE.Vector3(3.0,2.4,-68.3),new THREE.Vector3(4.15,2.3,-68.3),new THREE.Vector3(5.25,2.3,-68.3)];
guidedTourStops.find((stop)=>stop.id==='sanctuary-threshold').via=[new THREE.Vector3(5.25,2.3,-68.3),new THREE.Vector3(4.15,2.3,-68.3),new THREE.Vector3(3.0,2.4,-68.3),new THREE.Vector3(3.0,2.4,-64.0),new THREE.Vector3(0,2.35,-64.0),new THREE.Vector3(0,2.35,-60.5)];
const guidedTourState={active:false,index:0,timer:null,settleTimer:null,targetExposure:1.08,lastSettledStop:null,completed:false,finalHold:false};
function clearGuidedTourTimers(){if(guidedTourState.timer)clearTimeout(guidedTourState.timer);if(guidedTourState.settleTimer)clearTimeout(guidedTourState.settleTimer);guidedTourState.timer=null;guidedTourState.settleTimer=null;}
function applyGuidedStopPose(stop){cameraTween=null;camera.position.copy(stop.position);controls.target.copy(stop.target);camera.fov=stop.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);guidedTourState.targetExposure=stop.exposure;renderer.toneMappingExposure=stop.exposure;updateMarkerSprites();renderer.render(scene,camera);}
function guidedPoseDetail(stop,index){return{index,id:stop.id,position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov,exposure:renderer.toneMappingExposure,timestamp:Date.now()};}
function stopGuidedTour(){const wasActive=guidedTourState.active;guidedTourState.active=false;guidedTourState.finalHold=false;clearGuidedTourTimers();guidedTourState.targetExposure=1.08;document.getElementById('guided-tour-btn')?.classList.remove('active');if(wasActive||markerSuppressionReasons.has('guided-tour'))setMarkersSuppressed('guided-tour',false);}
function finishGuidedTour(){const finalStop=guidedTourStops.at(-1);applyGuidedStopPose(finalStop);guidedTourState.active=false;guidedTourState.completed=true;guidedTourState.finalHold=true;clearGuidedTourTimers();document.getElementById('guided-tour-btn')?.classList.remove('active');setMarkersSuppressed('guided-tour',false);window.dispatchEvent(new CustomEvent('bastet:guided-tour-finished',{detail:guidedPoseDetail(finalStop,guidedTourStops.length-1)}));}
function runGuidedStop(){
  if(!guidedTourState.active)return;
  const stopIndex=guidedTourState.index,stop=guidedTourStops[stopIndex],positionPath=[camera.position.clone(),...(stop.via||[]).map((point)=>point.clone()),stop.position.clone()],pathDistances=[0];
  for(let i=1;i<positionPath.length;i++)pathDistances.push(pathDistances[i-1]+positionPath[i-1].distanceTo(positionPath[i]));
  guidedTourState.targetExposure=stop.exposure;
  cameraTween={fromP:camera.position.clone(),toP:stop.position.clone(),positionPath,pathDistances,pathDistance:pathDistances.at(-1),fromT:controls.target.clone(),toT:stop.target.clone(),fromFov:camera.fov,toFov:stop.fov,start:performance.now(),duration:stop.moveDuration};
  guidedTourState.index=stopIndex+1;
  guidedTourState.settleTimer=setTimeout(()=>{if(!guidedTourState.active)return;applyGuidedStopPose(stop);const detail=guidedPoseDetail(stop,stopIndex);guidedTourState.lastSettledStop=detail;window.dispatchEvent(new CustomEvent('bastet:guided-stop-settled',{detail}));},stop.moveDuration);
  guidedTourState.timer=setTimeout(()=>guidedTourState.index>=guidedTourStops.length?finishGuidedTour():runGuidedStop(),stop.moveDuration+stop.holdDuration);
}
function toggleGuidedTour(){if(guidedTourState.active){stopGuidedTour();return;}if(walkState.active)exitWalkMode();qaCameraActive=false;infoPanel.classList.remove('open');guidedTourState.active=true;guidedTourState.completed=false;guidedTourState.finalHold=false;guidedTourState.index=0;setMarkersSuppressed('guided-tour',true);document.getElementById('guided-tour-btn')?.classList.add('active');runGuidedStop();}




function focusOnObject(object){
  if(!object || object.isSprite) return;
  focusReturnState={position:camera.position.clone(),target:controls.target.clone(),walk:walkState.active,yaw:walkState.yaw,pitch:walkState.pitch,targetYaw:walkState.targetYaw,targetPitch:walkState.targetPitch};
  returnViewBtn.classList.remove('hidden');
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const dir = camera.position.clone().sub(center);
  if(dir.lengthSq() < 0.001) dir.set(1.2, .45, 1.25);
  dir.normalize();
  const distance = Math.max(5.5, Math.min(22, size.length() * 1.55));
  const toPos = center.clone().addScaledVector(dir, distance);
  toPos.y = Math.max(center.y + Math.max(1.8, size.y * 0.65), camera.position.y * 0.22 + center.y * 0.78);
  cameraTween = { fromP: camera.position.clone(), toP: toPos, fromT: controls.target.clone(), toT: center.clone(), start: performance.now(), duration: 920 };
  if(walkState.active){walkState.focusPaused=true;clearWalkInput(false);}
}
function returnToPreviousView(){
  if(!focusReturnState) return;
  cameraTween = { fromP: camera.position.clone(), toP: focusReturnState.position.clone(), fromT: controls.target.clone(), toT: focusReturnState.target.clone(), start: performance.now(), duration: 900 };
  if(walkState.active){walkState.yaw=focusReturnState.yaw;walkState.pitch=focusReturnState.pitch;walkState.targetYaw=focusReturnState.targetYaw;walkState.targetPitch=focusReturnState.targetPitch;walkState.focusPaused=false;}
  focusReturnState = null;
  returnViewBtn.classList.add('hidden');
}
focusObjectBtn.addEventListener('click', ()=> selectedItem && focusOnObject(selectedItem));
returnViewBtn.addEventListener('click', returnToPreviousView);

document.getElementById('screenshot-btn').addEventListener('click',()=>{
  qualityState.screenshot=true; const oldRatio = renderer.getPixelRatio();
  const width = window.innerWidth, height = window.innerHeight;
  setMarkersSuppressed('screenshot',true);
  try{
    renderer.setPixelRatio(Math.min(3, oldRatio * 2));
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
    const link = document.createElement('a');
    link.download='bastet-temple-v18-doctor-final.png';
    link.href = renderer.domElement.toDataURL('image/png');
    link.click();
  }finally{
    renderer.setPixelRatio(oldRatio);
    renderer.setSize(width,height,false);qualityState.screenshot=false;qualityState.current=oldRatio;
    setMarkersSuppressed('screenshot',false);
  }
});

document.getElementById('export-btn').addEventListener('click', async () => {
  const button=document.getElementById('export-btn');button.disabled=true;button.textContent=t('export.working');
  try {
    const exporter=new GLTFExporter();
    const result=await exporter.parseAsync(templeModel,{binary:true,onlyVisible:false,truncateDrawRange:true,maxTextureSize:2048});
    const blob=new Blob([result],{type:'model/gltf-binary'}); const url=URL.createObjectURL(blob); const link=document.createElement('a'); link.href=url; link.download='bastet-temple-bubastis-v18-doctor-final.glb'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1200);
  } catch(error){console.error(error);alert(t('export.error'));}
  finally {button.disabled=false;button.textContent=t('export.glb');}
});

function easeInOutCubic(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function updateDepthAtmosphere(dt){
  let target=1.08;
  if(camera.position.z<70) target=THREE.MathUtils.mapLinear(THREE.MathUtils.clamp(camera.position.z,-72,70),-72,70,.68,1.02);
  if(camera.position.z<PLAN.zone28WestZ&&camera.position.z>PLAN.zone29WestZ) target=Math.max(target,1.00); // open courtyard receives sky light
  if(guidedTourState.active||guidedTourState.finalHold||qaCameraActive) target=guidedTourState.targetExposure;
  renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,target,1-Math.exp(-2.2*dt));
  const sanctuaryNear=THREE.MathUtils.clamp((-camera.position.z-46)/28,0,1);
  cultFocusGlow.intensity=.76+sanctuaryNear*.82;
  sanctuaryGlow.intensity=.18+sanctuaryNear*.34;
  naosKeyLight.intensity=.78+sanctuaryNear*1.32;
  starCeilingFill.intensity=18.0+sanctuaryNear*6.5;
  sideChamberFillLights.forEach((light)=>{light.intensity=.20+sanctuaryNear*.30;});
}
function updateMarkerSprites(){
  const closeArchaeologicalId = infoPanel.classList.contains('open') ? Number((document.getElementById('zone-badge').textContent.match(/(\d+)/)||[])[1]||0) : 0;
  for (const sprite of markerSprites) {
    const dist = camera.position.distanceTo(sprite.position);
    const s = THREE.MathUtils.clamp(sprite.userData.baseScale * (dist / 180), 2.4, sprite.userData.baseScale * 1.05);
    sprite.scale.set(s, s, 1);
    const isClose = dist < 42;
    const isSelected = closeArchaeologicalId && sprite.userData.zone?.archaeologicalId === closeArchaeologicalId;
    sprite.visible = markersGroup.visible && (!isClose || isSelected);
  }
}


const walkBtn = document.getElementById('walk-btn');
const walkHud = document.getElementById('walk-hud');
const walkExitBtn = document.getElementById('walk-exit-btn');
const presentationBtn = document.getElementById('presentation-btn');
const presentationExitBtn = document.getElementById('presentation-exit');
const walkCursorHint = document.getElementById('walk-cursor-hint');



const collisionBoxes=[];const collisionGrid=new Map();const COLLISION_CELL=18;
function collisionKey(x,z){return`${Math.floor(x/COLLISION_CELL)},${Math.floor(z/COLLISION_CELL)}`;}
function addCollisionToGrid(box){for(let ix=Math.floor(box.min.x/COLLISION_CELL);ix<=Math.floor(box.max.x/COLLISION_CELL);ix++)for(let iz=Math.floor(box.min.z/COLLISION_CELL);iz<=Math.floor(box.max.z/COLLISION_CELL);iz++){const k=`${ix},${iz}`;if(!collisionGrid.has(k))collisionGrid.set(k,[]);collisionGrid.get(k).push(box);}}
function addCollisionProxy(object,padding=.42){
  const name=object.name||'';if(object.userData?.excludeFromCollision||/Doorway|Naos_Door|Threshold|Processional|Floor|Joint|Dust|Wear|Age_|Roof|Ceiling|Relief|Glyph|Deity|Text_|Iconography|Bastet_|Info_Stela|Canopus_Display_Base|Historical_Evidence/i.test(name))return;
  const box3=new THREE.Box3().setFromObject(object),size=new THREE.Vector3();box3.getSize(size);
  if(size.x<.38&&size.z<.38)return;if(box3.max.y<=.48||box3.min.y>=2.45)return;
  const isColumn = Boolean(object.userData?.columnInfo) || /Column|Shaft|Base|Abacus|Palmiform|Hathor/i.test(name);
  let dimensionNode=object;while(dimensionNode&&!dimensionNode.userData?.requestedRadius)dimensionNode=dimensionNode.parent;
  if(isColumn&&dimensionNode?.userData?.requestedRadius){const center=box3.getCenter(new THREE.Vector3()),shaftRadius=dimensionNode.userData.requestedRadius*1.12;box3.min.x=center.x-shaftRadius;box3.max.x=center.x+shaftRadius;box3.min.z=center.z-shaftRadius;box3.max.z=center.z+shaftRadius;}
  const effectivePadding = isColumn ? Math.min(padding, .08) : padding;
  box3.min.x-=effectivePadding;box3.max.x+=effectivePadding;box3.min.z-=effectivePadding;box3.max.z+=effectivePadding;collisionBoxes.push(box3);addCollisionToGrid(box3);
}
function isEffectivelyVisible(object){let node=object;while(node){if(node.visible===false)return false;node=node.parent;}return true;}
function registerCollisionBoxes(){collisionBoxes.length=0;collisionGrid.clear();for(const group of[existingRuinsGroup,architectureGroup,columnsGroup,ritualGroup,v6Group]){if(!isEffectivelyVisible(group))continue;group.traverse(obj=>{if(obj.isMesh&&isEffectivelyVisible(obj))addCollisionProxy(obj,group===columnsGroup?.05:.28);});}}
function nearbyCollisionBoxes(position){const result=new Set();const cx=Math.floor(position.x/COLLISION_CELL),cz=Math.floor(position.z/COLLISION_CELL);for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)for(const b of collisionGrid.get(`${cx+dx},${cz+dz}`)||[])result.add(b);return result;}

const walkState={active:false,yaw:0,pitch:0,targetYaw:0,targetPitch:0,eyeHeight:1.74,playerHeight:1.78,speed:10.8,boost:1.45,acceleration:14.0,deceleration:13.2,lookResponse:14.8,keys:{},playerRadius:.24,focusPaused:false,dragging:false,didLookDrag:false,localVelocity:new THREE.Vector2(),targetVelocity:new THREE.Vector2(),candidate:new THREE.Vector3(),forward:new THREE.Vector3(),right:new THREE.Vector3(),delta:new THREE.Vector3()};
const MOVEMENT_CODES=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight']);
function syncWalkAnglesFromCamera(){walkState.yaw=Math.atan2(camera.position.x-controls.target.x,camera.position.z-controls.target.z);const horizontal=Math.hypot(camera.position.x-controls.target.x,camera.position.z-controls.target.z);walkState.pitch=Math.atan2(controls.target.y-camera.position.y,horizontal);walkState.targetYaw=walkState.yaw;walkState.targetPitch=walkState.pitch;}
function applyWalkOrientation(dt=0,immediate=false){const blend=immediate?1:1-Math.exp(-walkState.lookResponse*dt);walkState.yaw=THREE.MathUtils.lerp(walkState.yaw,walkState.targetYaw,blend);walkState.pitch=THREE.MathUtils.lerp(walkState.pitch,walkState.targetPitch,blend);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(walkState.pitch,walkState.yaw,0,'YXZ'));camera.quaternion.copy(q);const forward=new THREE.Vector3(0,0,-1).applyQuaternion(q);controls.target.copy(camera.position).add(forward.multiplyScalar(4));}
function clearWalkInput(clearInfo=false){walkState.keys={};walkState.localVelocity.set(0,0);walkState.targetVelocity.set(0,0);if(clearInfo){infoPanel.classList.remove('open');clearSelection();}}
function enterWalkMode(){
  stopGuidedTour();clearWalkInput(true);focusReturnState=null;returnViewBtn.classList.add('hidden');
  walkState.active=true;walkState.focusPaused=false;walkState.dragging=false;walkState.didLookDrag=false;controls.enabled=false;
  document.body.classList.add('walk-mode');walkHud.classList.remove('hidden');walkCursorHint.classList.remove('hidden');walkCrosshair.classList.remove('hidden');
  syncWalkAnglesFromCamera();
  if(camera.position.y>7||camera.position.z>133||camera.position.z<-84){camera.position.set(0,walkState.eyeHeight,127);controls.target.set(0,walkState.eyeHeight,118);syncWalkAnglesFromCamera();}
  camera.position.y=walkState.eyeHeight;
  if(!canWalkTo(camera.position)){camera.position.set(0,walkState.eyeHeight,127);controls.target.set(0,walkState.eyeHeight,118);syncWalkAnglesFromCamera();}
  applyWalkOrientation(0,true);
}
function exitWalkMode(){walkState.active=false;walkState.focusPaused=false;controls.enabled=true;document.body.classList.remove('walk-mode');walkHud.classList.add('hidden');walkCursorHint.classList.add('hidden');walkCrosshair.classList.add('hidden');hideHoverLabel();walkState.dragging=false;clearWalkInput(false);}
function canWalkTo(position){const r=walkState.playerRadius,head=walkState.eyeHeight+.28;if(position.x<-20.5+r||position.x>20.5-r||position.z<-80+r||position.z>132-r)return false;for(const box of nearbyCollisionBoxes(position)){if(head<box.min.y||.15>box.max.y)continue;const nx=THREE.MathUtils.clamp(position.x,box.min.x,box.max.x),nz=THREE.MathUtils.clamp(position.z,box.min.z,box.max.z),dx=position.x-nx,dz=position.z-nz;if(dx*dx+dz*dz<r*r)return false;}return true;}
function moveCapsule(delta){const distance=delta.length();if(distance<1e-6)return;const steps=Math.min(20,Math.max(1,Math.ceil(distance/.14))),step=delta.clone().multiplyScalar(1/steps);for(let i=0;i<steps;i++){walkState.candidate.copy(camera.position).add(step);walkState.candidate.y=walkState.eyeHeight;if(canWalkTo(walkState.candidate)){camera.position.copy(walkState.candidate);continue;}const tryX=new THREE.Vector3(walkState.candidate.x,walkState.eyeHeight,camera.position.z),tryZ=new THREE.Vector3(camera.position.x,walkState.eyeHeight,walkState.candidate.z);let moved=false;if(canWalkTo(tryX)){camera.position.copy(tryX);moved=true;}if(canWalkTo(tryZ)){camera.position.copy(tryZ);moved=true;}if(!moved){walkState.localVelocity.multiplyScalar(.30);break;}}}
function updateWalkMode(dt){if(!walkState.active||walkState.focusPaused)return;if(!document.hasFocus()){clearWalkInput(false);return;}applyWalkOrientation(dt);const inputX=((walkState.keys.KeyD||walkState.keys.ArrowRight)?1:0)-((walkState.keys.KeyA||walkState.keys.ArrowLeft)?1:0),inputZ=((walkState.keys.KeyW||walkState.keys.ArrowUp)?1:0)-((walkState.keys.KeyS||walkState.keys.ArrowDown)?1:0),length=Math.hypot(inputX,inputZ)||1,sprint=(walkState.keys.ShiftLeft||walkState.keys.ShiftRight)?walkState.boost:1;walkState.targetVelocity.set(inputX/length*walkState.speed*sprint,inputZ/length*walkState.speed*sprint);const response=inputX||inputZ?walkState.acceleration:walkState.deceleration,blend=1-Math.exp(-response*dt);walkState.localVelocity.lerp(walkState.targetVelocity,blend);if(walkState.localVelocity.lengthSq()<.0016)walkState.localVelocity.set(0,0);walkState.forward.set(0,0,-1).applyQuaternion(camera.quaternion);walkState.forward.y=0;walkState.forward.normalize();walkState.right.set(-walkState.forward.z,0,walkState.forward.x);walkState.delta.set(0,0,0).addScaledVector(walkState.forward,walkState.localVelocity.y*dt).addScaledVector(walkState.right,walkState.localVelocity.x*dt);moveCapsule(walkState.delta);camera.position.y=walkState.eyeHeight;applyWalkOrientation(dt);}

walkBtn.addEventListener('click', ()=> walkState.active ? exitWalkMode() : enterWalkMode());
walkExitBtn.addEventListener('click', exitWalkMode);
function refreshSpatialIndexes(){registerV18InteractiveObjects();registerCollisionBoxes();}
function publishCollisionQA(){
  const points={frontApproach:[0,-64],naosCenter:[0,MODEL_DIMENSIONS.naos.centerZ],naosLeftClearance:[-2.1,MODEL_DIMENSIONS.naos.centerZ],naosRightClearance:[2.1,MODEL_DIMENSIONS.naos.centerZ],leftDoor:[-4.15,-65.3],rightDoor:[4.15,-68.3],leftChamber:[-6.2,-65.3],rightChamber:[6.2,-68.3]};
  const result={};for(const [name,[x,z]]of Object.entries(points))result[name]=canWalkTo(new THREE.Vector3(x,walkState.eyeHeight,z));
  document.documentElement.dataset.qaCollision=JSON.stringify(result);return result;
}
function schedulePerformanceQA(){
  const samples=[];let last=performance.now();const frame=(now)=>{samples.push(now-last);last=now;if(samples.length<160){requestAnimationFrame(frame);return;}const values=samples.slice(20),sorted=[...values].sort((a,b)=>a-b);let triangles=0;templeModel.traverse((object)=>{if(!object.isMesh||!object.geometry)return;triangles+=(object.geometry.index?.count??object.geometry.attributes.position.count)/3;});document.documentElement.dataset.qaPerformance=JSON.stringify({frames:values.length,averageMs:values.reduce((sum,value)=>sum+value,0)/values.length,p95Ms:sorted[Math.floor(sorted.length*.95)],triangles,rendererTriangles:renderer.info.render.triangles,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio});};requestAnimationFrame(frame);
}
function setLayerVisibility(group,visible){group.visible=visible;refreshSpatialIndexes();}
document.getElementById('ruins-toggle')?.addEventListener('change',e=>setLayerVisibility(existingRuinsGroup,e.target.checked));
document.getElementById('reconstruction-toggle')?.addEventListener('change',e=>setLayerVisibility(reconstructedTempleGroup,e.target.checked));
document.getElementById('pigment-toggle')?.addEventListener('change',e=>{pigmentTracesGroup.visible=e.target.checked;refreshSpatialIndexes();});
document.getElementById('guided-tour-btn')?.addEventListener('click',toggleGuidedTour);

renderer.domElement.addEventListener('pointerdown', (event)=>{
  if(!walkState.active || (event.button !== 2 && event.pointerType !== 'touch')) return;
  walkState.dragging = true;
  walkState.didLookDrag = false;
  walkState.lastPointerX = event.clientX;
  walkState.lastPointerY = event.clientY;
  renderer.domElement.setPointerCapture?.(event.pointerId);
});
renderer.domElement.addEventListener('pointerup', (event)=>{
  if(event.button === 2 || event.pointerType === 'touch') walkState.dragging = false;
});
renderer.domElement.addEventListener('pointerleave', ()=>{ walkState.dragging = false; });
renderer.domElement.addEventListener('pointermove', (event)=>{
  if(!walkState.active || !walkState.dragging) return;
  const dx = event.clientX - walkState.lastPointerX;
  const dy = event.clientY - walkState.lastPointerY;
  if(Math.hypot(dx,dy)>2)walkState.didLookDrag=true;
  walkState.lastPointerX = event.clientX;
  walkState.lastPointerY = event.clientY;
  walkState.targetYaw-=dx*.0040;walkState.targetPitch=THREE.MathUtils.clamp(walkState.targetPitch-dy*.0030,-1.05,1.05);
});

document.querySelectorAll('[data-walk-key]').forEach((button)=>{
  const code=button.dataset.walkKey;
  const press=(event)=>{if(!walkState.active)return;event.preventDefault();walkState.keys[code]=true;button.setPointerCapture?.(event.pointerId);};
  const release=(event)=>{event.preventDefault();delete walkState.keys[code];};
  button.addEventListener('pointerdown',press);
  for(const eventName of['pointerup','pointercancel','lostpointercapture','pointerleave'])button.addEventListener(eventName,release);
});

document.addEventListener('keydown',(e)=>{if(e.target&&['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(walkState.active&&MOVEMENT_CODES.has(e.code)){e.preventDefault();walkState.keys[e.code]=true;}if(e.code==='Escape'&&walkState.active){infoPanel.classList.remove('open');clearSelection();clearWalkInput(false);}if(e.code==='KeyE'&&walkState.active){pointer.set(0,0);raycaster.far=18;raycaster.setFromCamera(pointer,camera);inspectCandidate(getInteractiveCandidateFromCurrentRay());}});
function releaseKey(e){if(MOVEMENT_CODES.has(e.code))delete walkState.keys[e.code];}
document.addEventListener('keyup',releaseKey,true);window.addEventListener('keyup',releaseKey,true);
for(const eventName of['blur','focus','pagehide','pageshow'])window.addEventListener(eventName,()=>clearWalkInput(false));
document.addEventListener('visibilitychange',()=>clearWalkInput(false));
renderer.domElement.addEventListener('pointercancel',()=>{walkState.dragging=false;clearWalkInput(false);});
renderer.domElement.addEventListener('lostpointercapture',()=>{walkState.dragging=false;});
window.addEventListener('mouseup',()=>{walkState.dragging=false;});
infoPanel.addEventListener('pointerenter',()=>clearWalkInput(false));
renderer.domElement.addEventListener('contextmenu',(e)=>{e.preventDefault();walkState.dragging=false;});

function togglePresentationMode(force){
  const active = force !== undefined ? force : !document.body.classList.contains('presentation-mode');
  document.body.classList.toggle('presentation-mode', active);
  presentationExitBtn.classList.toggle('hidden', !active);
  setMarkersSuppressed('presentation',active);
}
presentationBtn.addEventListener('click', ()=> togglePresentationMode(true));
presentationExitBtn.addEventListener('click', ()=> togglePresentationMode(false));

function setGuidedTourStopForQA(index){
  const stop=guidedTourStops[index];if(!stop)throw new RangeError(`Unknown guided-tour stop index ${index}`);
  if(guidedTourState.active)stopGuidedTour();
  guidedTourState.finalHold=false;qaCameraActive=true;cameraTween=null;camera.position.copy(stop.position);controls.target.copy(stop.target);camera.fov=stop.fov;camera.updateProjectionMatrix();camera.lookAt(controls.target);
  guidedTourState.targetExposure=stop.exposure;renderer.toneMappingExposure=stop.exposure;updateMarkerSprites();renderer.render(scene,camera);
  return {index,id:stop.id,position:stop.position.toArray(),target:stop.target.toArray(),exposure:stop.exposure,fov:stop.fov};
}
function applyGuidedTourQAHash(){
  const stopMatch=location.hash.match(/^#qa-guided-stop-(\d+)$/);
  const cameraMatch=location.hash.match(/^#qa-camera=([\d.,-]+)$/);
  if(!stopMatch&&!cameraMatch)return;
  infoPanel.classList.remove('open');setMarkersSuppressed('capture',true);
  if(stopMatch){setGuidedTourStopForQA(Number(stopMatch[1])-1);return;}
  const values=cameraMatch[1].split(',').map(Number);if(![6,7].includes(values.length)||values.some((value)=>!Number.isFinite(value)))return;
  qaCameraActive=true;camera.position.set(...values.slice(0,3));controls.target.set(...values.slice(3,6));if(values[6]){camera.fov=values[6];camera.updateProjectionMatrix();}camera.lookAt(controls.target);renderer.render(scene,camera);document.documentElement.dataset.qaCamera=values.join(',');
}
window.addEventListener('hashchange',applyGuidedTourQAHash);
function validateGuidedTourPaths(sampleSpacing=.18,cameraRadius=.16){
  const meshes=[];for(const group of[architectureGroup,columnsGroup,roofsGroup,v6Group])group.traverse((object)=>{if(!object.isMesh||!isEffectivelyVisible(object))return;const name=object.name||'';if(object.userData?.excludeFromCollision||/Floor|Relief|Glyph|Text_|Deity|Iconography|Age_|Wear|Dust|Threshold|Ceiling/i.test(name))return;const box=new THREE.Box3().setFromObject(object);let dimensionNode=object;while(dimensionNode&&!dimensionNode.userData?.requestedRadius)dimensionNode=dimensionNode.parent;if(dimensionNode?.userData?.requestedRadius){const center=box.getCenter(new THREE.Vector3()),shaftRadius=dimensionNode.userData.requestedRadius*1.12;box.min.x=center.x-shaftRadius;box.max.x=center.x+shaftRadius;box.min.z=center.z-shaftRadius;box.max.z=center.z+shaftRadius;}meshes.push({name,box});});
  const results=[];
  for(let i=1;i<guidedTourStops.length;i++){
    const from=guidedTourStops[i-1].position,to=guidedTourStops[i].position,points=[from,...(guidedTourStops[i].via||[]),to];let collision=null,distance=0;
    for(let segment=1;segment<points.length&&!collision;segment++){const a=points[segment-1],b=points[segment],segmentDistance=a.distanceTo(b),steps=Math.max(2,Math.ceil(segmentDistance/sampleSpacing));distance+=segmentDistance;for(let step=1;step<steps&&!collision;step++){const point=new THREE.Vector3().lerpVectors(a,b,step/steps);for(const item of meshes)if(item.box.distanceToPoint(point)<cameraRadius){collision={mesh:item.name,point:point.toArray()};break;}}}
    results.push({from:guidedTourStops[i-1].id,to:guidedTourStops[i].id,distance,collision});
  }
  return results;
}

let lastFrameTime=performance.now();const qualityState={max:Math.min(window.devicePixelRatio,1.75),min:1.15,current:renderer.getPixelRatio(),averageMs:16.7,lastAdjust:performance.now(),screenshot:false};
function updateAdaptiveQuality(dt,now){if(qualityState.screenshot)return;qualityState.averageMs=THREE.MathUtils.lerp(qualityState.averageMs,dt*1000,.045);if(now-qualityState.lastAdjust<3000)return;qualityState.lastAdjust=now;let next=qualityState.current;if(qualityState.averageMs>24)next=Math.max(qualityState.min,next-.12);else if(qualityState.averageMs<17.2)next=Math.min(qualityState.max,next+.08);if(Math.abs(next-qualityState.current)>.03){qualityState.current=next;renderer.setPixelRatio(next);renderer.setSize(window.innerWidth,window.innerHeight,false);}}
function animate(now){requestAnimationFrame(animate);const dt=Math.min(.05,(now-lastFrameTime)/1000);lastFrameTime=now;if(cameraTween){const raw=Math.min(1,(now-cameraTween.start)/cameraTween.duration),t=easeInOutCubic(raw);if(cameraTween.positionPath?.length>2){const travel=t*cameraTween.pathDistance;let segment=1;while(segment<cameraTween.pathDistances.length-1&&travel>cameraTween.pathDistances[segment])segment++;const startDistance=cameraTween.pathDistances[segment-1],segmentLength=cameraTween.pathDistances[segment]-startDistance,local=segmentLength?THREE.MathUtils.clamp((travel-startDistance)/segmentLength,0,1):1;camera.position.lerpVectors(cameraTween.positionPath[segment-1],cameraTween.positionPath[segment],local);}else camera.position.lerpVectors(cameraTween.fromP,cameraTween.toP,t);controls.target.lerpVectors(cameraTween.fromT,cameraTween.toT,t);if(cameraTween.toFov!==undefined){camera.fov=THREE.MathUtils.lerp(cameraTween.fromFov,cameraTween.toFov,t);camera.updateProjectionMatrix();}camera.lookAt(controls.target);if(raw>=1)cameraTween=null;}if(!walkState.active){if(guidedTourState.active||guidedTourState.finalHold||qaCameraActive)camera.lookAt(controls.target);else controls.update();}if(!cameraTween)updateWalkMode(dt);refreshOutline(hoverOutline,hoveredItem?.focusObject||hoveredItem?.object);refreshOutline(selectedOutline,selectedItem);updateMarkerSprites();updateAdaptiveQuality(dt,now);updateDepthAtmosphere(dt);renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});


async function init(){
  if(UI_QA_MODE){
    document.documentElement.dataset.uiQa='true';
    window.BastetViewer={
      scene,camera,controls,renderer,zoneData,COLUMN_METADATA,setLanguage,getLanguage:()=>currentLanguage,toggleNarration,getAudioState:()=>({language:narrationLanguage||currentLanguage,playing:isNarrationPlaying(),src:narrationAudio?.currentSrc||narrationAudio?.src||'',currentTime:narrationAudio?.currentTime||0,duration:Number.isFinite(narrationAudio?.duration)?narrationAudio.duration:null}),
      openZone,openColumn,openRelief,openV18Object,modelDimensions:MODEL_DIMENSIONS,
      ready:true,uiQa:true,version:'V18.2-bilingual-audio'
    };
    openZone(zoneData[0]);
    loading.classList.add('hidden');
    notifyParent('TOUR_READY',{language:currentLanguage});
    return;
  }
  buildTemple(); buildV18MuseumDetails(); buildEnvironment();
  await buildReliefs();
  markersGroup.visible=true;environment.visible=true;existingRuinsGroup.visible=true;reconstructedTempleGroup.visible=true;pigmentTracesGroup.visible=false;reliefsGroup.visible=true;columnsGroup.visible=true;ritualGroup.visible=true;roofsGroup.visible=true;v6Group.visible=true;
  document.documentElement.dataset.markerState=JSON.stringify({visible:true,reasons:[]});
  refreshSpatialIndexes();
  publishCollisionQA();schedulePerformanceQA();
  document.documentElement.dataset.qaTourPaths=JSON.stringify(validateGuidedTourPaths(.18));
  for (const material of reliefMaterials) material.map = material.userData.colorMap || material.map;
  window.BastetViewer={scene,camera,controls,renderer,templeModel,existingRuinsGroup,reconstructedTempleGroup,probableReconstructionGroup,interpretiveAdditionsGroup,pigmentTracesGroup,architectureGroup,columnsGroup,reliefsGroup,ritualGroup,roofsGroup,v6Group,markersGroup,interactiveColumns,interactiveV18Objects,COLUMN_METADATA,zoneData,guidedTourStops,guidedTourState,flyCamera,setGuidedTourStopForQA,validateGuidedTourPaths,setMarkersSuppressed,setCaptureMode,togglePresentationMode,toggleGuidedTour,canWalkTo,setLanguage,getLanguage:()=>currentLanguage,toggleNarration,getAudioState:()=>({language:narrationLanguage||currentLanguage,playing:isNarrationPlaying(),src:narrationAudio?.currentSrc||narrationAudio?.src||'',currentTime:narrationAudio?.currentTime||0,duration:Number.isFinite(narrationAudio?.duration)?narrationAudio.duration:null}),openZone,openColumn,openRelief,openV18Object,markerSuppressionReasons,modelDimensions:MODEL_DIMENSIONS,qualityState,ready:true,version:'V18.2-bilingual-audio'};
  openZone(zoneData[0]);
  applyGuidedTourQAHash();
  loading.classList.add('hidden');
  notifyParent('TOUR_READY',{language:currentLanguage});
}

window.addEventListener('message', (event) => {
  if (event.origin !== window.location.origin || event.source !== window.parent) return;
  if (!event.data || typeof event.data !== 'object') return;
  
  if (event.data.type === 'STOP_AUDIO') {
    if (narrationAudio && !narrationAudio.paused) {
      narrationAudio.pause();
      narrationPlayRequested = false;
      if (typeof updateAudioButton === 'function') updateAudioButton();
    }
  } else if (event.data.type === 'PAUSE_TOUR') {
    if (typeof stopGuidedTour === 'function' && guidedTourState && guidedTourState.active) {
      stopGuidedTour();
    }
    if (typeof exitWalkMode === 'function' && walkState && walkState.active) {
      exitWalkMode();
    }
  } else if (event.data.type === 'RELEASE_POINTER_LOCK') {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  } else if (event.data.type === 'SET_LANGUAGE') {
    if (event.data.language && ['ar', 'en'].includes(event.data.language) && typeof setLanguage === 'function') {
      setLanguage(event.data.language);
    }
  }
});

init().catch((error)=>{console.error(error);loadingDetail.textContent=`${t('loading.error')}: ${error.message}`;notifyParent('TOUR_ERROR',{message:String(error?.message||error)});});
if(!UI_QA_MODE)animate(performance.now());
