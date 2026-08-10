export const V18_OBJECT_INFO = [
  {
    match: /Nectanebo_II_Naos|Naos_Red_Granite|EA1078|EA1079|EA1080/i,
    badge: 'إعادة بناء مرجحة — EA1078–EA1080',
    title: 'ناووس نختنبو الثاني من تل بسطة',
    englishTitle: 'Nectanebo II red-granite naos',
    description: 'إعادة تركيب رقمية تعتمد على أجزاء الناووس المحفوظة في المتحف البريطاني. القطع وأصلها من تل بسطة موثقان، لكن سجل المتحف يذكر ارتباكًا في توثيق EA1078–EA1080 ويصف إعادة التركيب المنشورة بأنها إشكالية؛ لذلك لا يمثل الشكل الكامل أو أبعاده أو موضعه الحالي يقينًا أثريًا.',
    technicalImplementation: 'V18: أبعاد العرض التصميمية محفوظة في model-dimensions-v18.json؛ هذا حقل تقني منفصل وليس وصفًا أو قياسًا أثريًا.',
    confidence: 'PROBABLE/INTERPRETIVE — القطع ATTESTED؛ الشكل الكامل والموضع الدقيق غير محسومين',
    type: 'ناووس / مقصورة حجرية', material: 'جرانيت أحمر داكن مع تآكل خفيف', period: 'نختنبو الثاني — الأسرة الثلاثون',
    source: 'British Museum EA1078, EA1079, EA1080؛ الأشكال 37 و38 و45',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1080',
    image: './assets/references/02_Nectanebo_II_Naos/Figures_37_38_Naos_Reconstruction.png'
  },
  {
    match: /Nectanebo_Star_Ceiling|Engraved_Star|Granite_Star_Roof/i,
    badge: 'إعادة بناء مرجحة — شكل 33',
    title: 'سقف جرانيت بنجوم محفورة',
    englishTitle: 'Engraved granite star ceiling',
    description: 'سقف حجري بنجوم غائرة متكررة دون إضاءة ذاتية. يمكن تشغيل آثار صبغة خافتة من طبقة منفصلة، ولا تمثل إعادة تلوين كاملة مؤكدة.',
    confidence: 'PROBABLE — نوع الزخرفة موثق، والتوزيع الكامل مرجح',
    type: 'سقف حجري منقوش', material: 'جرانيت', period: 'نختنبو الثاني',
    source: 'شكل 33 — قطعة جرانيت مزخرفة بالنجوم من سقف معبد نختنبو الثاني',
    sourceUrl: './assets/references/03_Nectanebo_Door_and_Ceiling/Figures_33_34_Star_Ceiling_and_Lintel.jpeg',
    image: './assets/references/03_Nectanebo_Door_and_Ceiling/Figures_33_34_Star_Ceiling_and_Lintel.jpeg'
  },
  {
    match: /Nectanebo_Entrance_Lintel|Nectanebo_Lintel/i,
    badge: 'إعادة بناء مرجحة — شكل 34',
    title: 'عتب مدخل معبد نختنبو الثاني',
    englishTitle: 'Nectanebo II temple lintel',
    description: 'عتب جرانيت يحمل شريطًا كتابيًا ومنطقة منظر ديني مبسطة. الجزء المحفوظ مرجع مباشر، أما استكمال العرض الكامل فمرجح.',
    confidence: 'PROBABLE — مبني على جزء أثري محفوظ',
    type: 'عتب باب', material: 'جرانيت أحمر', period: 'نختنبو الثاني',
    source: 'شكل 34 — جزء من عتب باب معبد نختنبو الثاني',
    sourceUrl: './assets/references/03_Nectanebo_Door_and_Ceiling/Figures_33_34_Star_Ceiling_and_Lintel.jpeg',
    image: './assets/references/03_Nectanebo_Door_and_Ceiling/Figures_33_34_Star_Ceiling_and_Lintel.jpeg'
  },
  {
    match: /Bastet_Cult_Focus|Bastet_Statue/i,
    badge: 'عنصر تفسيري',
    title: 'تمثال باستت داخل مشكاة الناووس',
    englishTitle: 'Interpretive cult statue of Bastet',
    description: 'تمثال توضيحي يحدد بؤرة العبادة داخل المشكاة. شكل تمثال العبادة الأصلي غير محفوظ بما يسمح بإعادة بنائه يقينًا.',
    confidence: 'INTERPRETIVE — افتراضي لأغراض الجولة',
    type: 'تمثال عبادة توضيحي', material: 'برونز تفسيري', period: 'غير محدد للشكل الرقمي',
    source: 'وظيفة الناووس وعبادة باستت؛ الشكل الرقمي غير موثق', sourceUrl: ''
  },
  {
    match: /Canopus_Decree_Hotspot|Canopus_Decree_Fragment/i,
    badge: 'نقطة معلومات — موضع عرض تفسيري',
    title: 'مرسوم كانوب',
    englishTitle: 'Canopus Decree information point',
    description: 'عُثر على جزء من مرسوم كانوب في صالة مدخل معبد باستت. النموذج يعرض المعلومة فقط، ولا يدّعي أن موضعه الرقمي هو موضعه الأصلي.',
    confidence: 'العثور مرتبط بصالة المدخل؛ موضع العرض INTERPRETIVE',
    type: 'Hotspot تعريفي', material: 'حجر داكن / بازلت تفسيري', period: 'بطلميوس الثالث',
    source: 'مرسوم كانوب — تل بسطة', sourceUrl: ''
  },
  {
    match: /HebSed_Festival_Kiosk/i,
    badge: 'إعادة بناء مرجحة',
    title: 'المقصورة الاحتفالية في صالة حب سد',
    englishTitle: 'Probable Heb-Sed ceremonial kiosk',
    description: 'مقصورة صغيرة تساعد على قراءة الوظيفة الاحتفالية للصالة. وجود المقاصير في برنامج المناظر موثق، لكن موضع هذه المقصورة وأبعادها داخل الجولة مرجحان.',
    confidence: 'PROBABLE — الوظيفة موثقة والموضع مرجح',
    type: 'مقصورة احتفالية', material: 'جرانيت أحمر', period: 'أوسركون الثاني',
    source: 'Louvre E10592؛ Penn Museum E225؛ Naville 1892',
    sourceUrl: 'https://collections.louvre.fr/ark:/53355/cl010010821',
    image: './assets/references/01_Osorkon_II_Sed_Festival/Figure_18_Festival_Hall_Gateway.jpeg'
  },
  {
    match: /EA1065|Palmiform/i,
    badge: 'عنصر موثق — EA1065',
    title: 'عمود نخلي من الجرانيت الأحمر',
    englishTitle: 'Red-granite palmiform column',
    description: 'عمود نخلي من معبد باستت يحمل أسماء وألقاب رمسيس الثاني، مع إعادة نحت جزئي لبعض الخراطيش لصالح أوسركون الثاني. النسخ الرقمية تستند إلى نوع القطعة وأبعادها المنشورة، بينما مواضع النسخ داخل المخطط تفسيرية.',
    confidence: 'موثق مباشرة في النوع والقطعة؛ الموضع الرقمي تفسيري',
    type: 'عمود نخلي', material: 'جرانيت أحمر', period: 'رمسيس الثاني؛ إعادة استخدام في عهد أوسركون الثاني',
    source: 'British Museum EA1065',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1065',
    image: './preview-v4-palmiform-column.png'
  },
  {
    match: /EA1107|Hathor/i,
    badge: 'عنصر موثق — EA1107',
    title: 'عمود حتحوري داخل الفناء المفتوح',
    englishTitle: 'Hathor capital and colossal column',
    description: 'القطعة EA1107 مرجع مباشر للتاج الحتحوري ولوجود أربعة أعمدة. في نسخة V18 نُفذت المنطقة 29 كفناء مستقل مفتوح من أعلى تنفيذًا لملاحظة الدكتور؛ الأعمدة تستند بصريًا إلى المرجع، بينما فتح الفناء وتوزيع العناصر قرار تصميمي تفسيري معلن.',
    confidence: 'التاج وعدد الأعمدة موثقان؛ الفناء المفتوح وتوزيع النسخ الرقمية INTERPRETIVE وفق طلب الدكتور',
    type: 'تاج حتحوري وعمود ضخم داخل فناء مفتوح', material: 'جرانيت أحمر متآكل بصريًا', period: 'الأسرة الثانية والعشرون',
    source: 'British Museum EA1107؛ وزارة السياحة والآثار المصرية',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1107',
    image: './preview-v4-hathor-column.png'
  },
  {
    match: /Osorkon|HebSed|Heb_Sed/i,
    badge: 'مجمع أوسركون الثاني',
    title: 'بوابة وقاعة عيد الحِب-سِد',
    englishTitle: 'Osorkon II Heb-Sed gateway and festival complex',
    description: 'أقام أوسركون الثاني بوابة ضخمة وزخرفها بمناظر احتفاله بعيد الحِب-سِد. النقوش والكتل الجرانيتية المنشورة تؤكد البرنامج الاحتفالي، أما الارتفاع الكامل وتجميع البوابة في النموذج فإعادة بناء تفسيرية.',
    confidence: 'البرنامج والنقوش موثقة؛ الارتفاع والتجميع الرقمي تفسيري',
    type: 'بوابة ومجمع احتفالي', material: 'عناصر من الجرانيت الأحمر مع جدران حجرية معاد بناؤها', period: 'عهد أوسركون الثاني',
    source: 'وزارة السياحة والآثار المصرية؛ British Museum EA1105',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1105'
  },
  {
    match: /Naos|Sanctuary|Cult_Focus|Bastet/i,
    badge: 'المنطقة المقدسة',
    title: 'قدس الأقداس ومقصورة باستت',
    englishTitle: 'Sanctuary and shrine of Bastet',
    description: 'جُدد الطرف الغربي الأقصى الذي يضم قدس الأقداس في عهد نختنبو الثاني. شكل المقصورة والسقف النجمي والتأثيث الطقسي في النموذج إعادة بناء تفسيرية محافظة.',
    confidence: 'العصر والموضوع العام موثقان؛ الشكل الكامل تفسيري',
    type: 'قدس أقداس ومقصورة مقدسة', material: 'جدران حجرية؛ الناووس والعناصر المميزة من الجرانيت الأحمر الداكن', period: 'الأسرة الثلاثون — نختنبو الثاني',
    source: 'وزارة السياحة والآثار المصرية؛ British Museum EA1106',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1106'
  },
  {
    match: /Capital|Abacus|Mask|Sistrum|Face_Main/i,
    badge: 'تفصيل عمود',
    title: 'تاج أو جزء علوي من عمود',
    englishTitle: 'Column capital or upper architectural member',
    description: 'جزء علوي ينقل الحمل من الكمرة إلى بدن العمود ويمنح العمود هويته النباتية أو الحتحورية. تفاصيل الاستكمال تختلف حسب نوع العمود ودرجة حفظ القطعة الأصلية.',
    confidence: 'موثق في بعض النماذج؛ أجزاء الاستكمال تختلف حسب العنصر',
    type: 'تاج عمود / Abacus', material: 'حجر جيري أو حجر رملي أو جرانيت أحمر بحسب المنطقة', period: 'وفق القاعة ونوع العمود',
    source: 'بيانات الأعمدة داخل المشروع ومراجع EA1065 وEA1107', sourceUrl: ''
  },
  {
    match: /Base_Ring|Column_Base|Pedestal|Podium/i,
    badge: 'تفصيل معماري',
    title: 'قاعدة أو منصة حجرية',
    englishTitle: 'Stone base or podium',
    description: 'قاعدة تحمل العمود أو العنصر المقدس وتفصل بينه وبين الأرضية. النسب التفصيلية لبعض القواعد في النموذج أُعيدت بصورة محافظة.',
    confidence: 'وظيفة معمارية مؤكدة؛ الأبعاد التفصيلية تفسيرية',
    type: 'قاعدة / منصة', material: 'كتلة حجرية أو جرانيت أحمر بحسب العنصر', period: 'وفق المنطقة',
    source: 'إعادة بناء معمارية محافظة', sourceUrl: ''
  },
  {
    match: /Papyrus|Bundle|Column/i,
    badge: 'عنصر معماري',
    title: 'عمود بردي أو عمود حزم نباتية',
    englishTitle: 'Papyrus-bundle column',
    description: 'تذكر المصادر الرسمية وجود رواق وقاعة أعمدة في القسم الغربي ضما أعمدة من حزم البردي وأعمدة حتحورية. النسب الدقيقة لبعض الأعمدة ومواضع النسخ داخل القاعات تفسيرية.',
    confidence: 'نوع الأعمدة موثق؛ النسب والمواضع الجزئية تفسيرية',
    type: 'عمود نباتي مصري', material: 'حجر أو جرانيت بحسب القاعة', period: 'الأسرة الثانية والعشرون في القسم الغربي',
    source: 'وزارة السياحة والآثار المصرية — معبد باستت',
    sourceUrl: 'https://egymonuments.gov.eg/en/monuments/the-temple-of-bastet/'
  },
  {
    match: /Gateway|Pylon|Entrance|Doorway|Door|Jamb/i,
    badge: 'مدخل معماري',
    title: 'مدخل أو بوابة في محور المعبد',
    englishTitle: 'Temple gateway or pylon entrance',
    description: 'بوابة على المحور الطقسي للمعبد. التسلسل العام مؤيد، لكن تقرير حفائر Area A يذكر أن الصرح الأول فُكك تمامًا دون أثر، لذلك لا يمكن اعتبار شكله أو ارتفاعه أو إحداثياته الرقمية توثيقًا أثريًا مباشرًا.',
    confidence: 'المحور العام مؤيد؛ الصرح والشكل والارتفاع والموضع التفصيلي INTERPRETIVE',
    type: 'بوابة أو صرح', material: 'حجر رملي أو جرانيت وفق العنصر', period: 'فترات متعددة',
    source: 'Lange-Athinodorou 2022، حفائر Area A؛ Naville 1891',
    sourceUrl: 'https://www.researchgate.net/publication/368720962_Lange-Athinodorou_Eva_2022_Preliminary_report_on_the_excavation_in_the_precinct_of_the_temple_of_Bastet_in_BubastisTell_Basta_Area_A_seasons_2009-2017_In_Wahby_Ayman_and_Penelope_Wilson_eds_The_Delta_'
  },
  {
    match: /Beam|Architrave|Lintel|Cornice/i,
    badge: 'إعادة بناء إنشائية',
    title: 'كمرة حجرية أو عتب',
    englishTitle: 'Stone architrave, beam or lintel',
    description: 'عنصر إنشائي رقمي يوضح نقل الأحمال من ألواح السقف إلى تيجان الأعمدة والجدران. وجود تغطية حجرية للقاعات مرجح معماريًا، لكن الأبعاد والموضع التفصيلي تفسيريان.',
    confidence: 'إعادة بناء معمارية مرجحة',
    type: 'كمرة حجرية / عتب', material: 'ألواح حجرية ثقيلة أو جرانيت أحمر بحسب القاعة', period: 'غير منسوب بدقة لكل قطعة رقمية',
    source: 'استنتاج إنشائي محافظ من تخطيط القاعات والأعمدة', sourceUrl: ''
  },
  {
    match: /Star_|Roof|Ceiling|Slab/i,
    badge: 'إعادة بناء السقف',
    title: 'لوح سقف أو سقف نجمي تفسيري',
    englishTitle: 'Interpretive roof slab or star ceiling',
    description: 'عنصر سقف مضاف لإظهار الشكل النهائي للقاعات المغطاة ومسار الضوء. الموضع والسماكة والإكمال ليست تسجيلًا أثريًا مباشرًا.',
    confidence: 'إعادة بناء تفسيرية',
    type: 'سقف أو لوح حجري', material: 'حجر؛ تلوين رمزي في السقف النجمي', period: 'وفق المنطقة',
    source: 'إعادة بناء معمارية محافظة', sourceUrl: ''
  },
  {
    match: /Offering|Incense|Ritual/i,
    badge: 'عنصر طقسي توضيحي',
    title: 'مائدة قرابين أو عنصر طقسي',
    englishTitle: 'Interpretive ritual furnishing',
    description: 'عنصر توضيحي يساعد على قراءة وظيفة القاعات المقدسة. وجود تقديم القرابين والطقوس مؤكد في النقوش، لكن شكل هذا العنصر وموضعه الحالي غير مثبتين أثريًا.',
    confidence: 'توضيحي؛ الموضع والشكل تفسيري',
    type: 'أثاث أو أداة طقسية', material: 'حجر أو معدن تفسيري', period: 'غير محدد للعنصر الرقمي',
    source: 'برنامج النقوش والطقوس في معبد باستت', sourceUrl: ''
  },
  {
    match: /Relief|Register|Procession|Deit|Kiosk|Adoration|Inventory/i,
    badge: 'نقش من تل بسطة',
    title: 'مشهد نقش أو سجل احتفالي',
    englishTitle: 'Relief scene or ritual register',
    description: 'النقش الرقمي مبني على مشاهد منشورة من تل بسطة، وخصوصًا برنامج عيد الحِب-سِد لأوسركون الثاني. بعض المشاهد موثقة مباشرة، بينما تثبيتها على هذا الجدار بعينه قد يكون سياقيًا أو تفسيريًا.',
    confidence: 'يختلف حسب القطعة؛ راجع بيانات النقش التفصيلية',
    type: 'نقش بارز ثلاثي الأبعاد', material: 'سطح حجري أو جرانيت أحمر مع عمق Relief محسّن', period: 'يرتبط أغلب البرنامج بأوسركون الثاني',
    source: 'Naville 1892؛ British Museum EA1105 وقطع تل بسطة',
    sourceUrl: 'https://www.britishmuseum.org/collection/object/Y_EA1105'
  },
  {
    match: /Threshold|Platform|Processional_Path/i,
    badge: 'عنصر حركة ومحور',
    title: 'عتبة أو منصة أو مسار طقسي',
    englishTitle: 'Threshold, platform or processional axis',
    description: 'تفصيل يوضح الانتقال بين القاعات والمحور المركزي. بعض الأبعاد وأنماط التآكل أضيفت لتسهيل القراءة المتحفية ولا تمثل توثيقًا حرفيًا.',
    confidence: 'المحور العام مرجح؛ التفاصيل تفسيرية',
    type: 'عتبة / منصة / مسار', material: 'حجر', period: 'فترات متعددة',
    source: 'المخطط الأثري وإعادة بناء المشروع', sourceUrl: ''
  },
  {
    match: /Wall|CrossWall|Partition|Enclosure/i,
    badge: 'إعادة بناء معمارية',
    title: 'جدار من المعبد المعاد بناؤه',
    englishTitle: 'Reconstructed temple wall',
    description: 'الجدار يوضح حدود القاعات والمحور الطقسي وفق المخطط المرجعي. الارتفاع الكامل وتفاصيل مداميك الحجر ودرجة الحفظ عناصر تفسيرية.',
    confidence: 'التخطيط العام مرجح؛ الارتفاع والتفاصيل تفسيرية',
    type: 'جدار حجري', material: 'حجر رملي أو طوب لبن وفق المنطقة', period: 'فترات متعددة',
    source: 'المخطط الأثري المنشور وإعادة بناء المشروع', sourceUrl: ''
  },
  {
    match: /Floor|Pavement|Joint|Dust|Wear/i,
    badge: 'تفصيل عرض متحفي',
    title: 'أرضية أو تفصيل حجري',
    englishTitle: 'Floor or museum-display surface detail',
    description: 'تفصيل بصري يحسن قراءة الأرضيات والممر الرئيسي ويظهر فواصل البلاطات وآثار الاستخدام الخفيفة. لا يمثل نمط رصف أثريًا موثقًا لكل جزء.',
    confidence: 'تفصيل عرض تفسيري',
    type: 'أرضية حجرية', material: 'حجر وغبار بصري', period: 'غير منسوب',
    source: 'معالجة بصرية للمشروع', sourceUrl: ''
  }
];

function normaliseUserDataInfo(data = {}) {
  if (!data.title || !data.description) return null;
  const archaeologicalId = data.archaeologicalId;
  return {
    badge: data.badge || (archaeologicalId ? `العنصر الأثري ${archaeologicalId}` : 'معلومة موثقة داخل الجولة'),
    title: data.title,
    englishTitle: data.englishTitle || '',
    description: data.description,
    confidence: data.confidence || data.certainty || 'غير محدد',
    type: data.type || 'عنصر معلوماتي',
    material: data.material || '',
    period: data.period || '',
    source: data.source || (data.sourceRefs || []).join('؛ '),
    sourceUrl: data.sourceUrl || '',
    image: data.image || '',
    special: data.special || '',
    note: data.note || ''
  };
}
export function findV18ObjectInfo(object) {
  let node = object;
  while (node) {
    if (node.userData?.v18Info) return node.userData.v18Info;
    const direct = normaliseUserDataInfo(node.userData);
    if (direct) return direct;
    const name = node.name || '';
    const entry = V18_OBJECT_INFO.find((item) => item.match.test(name));
    if (entry) return entry;
    node = node.parent;
  }
  return null;
}
