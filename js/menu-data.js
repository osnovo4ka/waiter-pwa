/** Полное меню заведения. Цены в рублях. */
window.MENU = {
  categories: [
    { id: "burgers", name: "Бургеры", emoji: "🍔" },
    { id: "sandwiches", name: "Сэндвичи", emoji: "🥪" },
    { id: "snacks", name: "Закуски", emoji: "🧀" },
    { id: "salads", name: "Салаты", emoji: "🥗" },
    { id: "soups", name: "Супы", emoji: "🍲" },
    { id: "pasta", name: "Паста", emoji: "🍝" },
    { id: "tori", name: "Тори-Тяхан", emoji: "🍚" },
    { id: "wok", name: "WOK", emoji: "🍜" },
    { id: "frit", name: "Фритерия", emoji: "🍟" },
    { id: "hot", name: "Горячее", emoji: "🥩" },
    { id: "desserts", name: "Десерты", emoji: "🍰" },
    { id: "bar", name: "Бар", emoji: "💧" },
    { id: "lemonades", name: "Авторские лимонады", emoji: "🍋" },
    { id: "bottled", name: "Бутылированные лимонады", emoji: "🥤" },
    { id: "energy", name: "Энергетики", emoji: "⚡" },
    { id: "beer", name: "Пиво", emoji: "🍺" },
    { id: "tea", name: "Чайная карта", emoji: "🍵" },
    { id: "coffee", name: "Кофе", emoji: "☕" },
    { id: "author-coffee", name: "Авторский кофе", emoji: "☕" },
    { id: "matcha", name: "Авторская матча-латте", emoji: "🍵" },
    { id: "cold-coffee", name: "Холодный кофе", emoji: "🧊" },
    { id: "nuts", name: "Снеки", emoji: "🥜" },
  ],
  groups: {
    burgerAddons: {
      id: "burgerAddons",
      title: "Дополните ваш бургер",
      multi: true,
      options: [
        { id: "jal", name: "Халапеньо", price: 70 },
        { id: "egg", name: "Яйцо", price: 65 },
        { id: "bacon", name: "Бекон", price: 85 },
        { id: "onion", name: "Лук", price: 65 },
        { id: "rings", name: "Луковые кольца", price: 65 },
        { id: "patty", name: "Котлета", price: 265 },
        { id: "cheddar", name: "Сыр чеддер", price: 75 },
        { id: "tomato", name: "Томаты", price: 65 },
        { id: "pickle", name: "Маринованный огурец", price: 65 },
      ],
    },
    sauces: {
      id: "sauces",
      title: "Выберите соус",
      multi: false,
      free: true,
      options: [
        { id: "cheese", name: "Сырный", price: 0 },
        { id: "garlic", name: "Чесночный", price: 0 },
        { id: "bbq", name: "Барбекю", price: 0 },
        { id: "sweet", name: "Свит-чили", price: 0 },
        { id: "ketchup", name: "Кетчуп", price: 0 },
      ],
    },
    fruitSize: {
      id: "fruitSize",
      title: "Вариант",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "f1400", name: "Фрукты", price: 1400 },
        { id: "f2000", name: "Фрукты, большой", price: 2000 },
      ],
    },
    water: {
      id: "water",
      title: "Вариант",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "spark", name: "Газированная", price: 260 },
        { id: "still", name: "Негазированная", price: 240 },
      ],
    },
    juice: {
      id: "juice",
      title: "Объём",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "j220", name: "Малый", price: 220 },
        { id: "j490", name: "Большой", price: 490 },
      ],
    },
    lem350: {
      id: "lem350",
      title: "Объём",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "350", name: "350 мл", price: 400 },
        { id: "1000", name: "1000 мл", price: 800 },
      ],
    },
    lemMojito: {
      id: "lemMojito",
      title: "Объём",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "350", name: "350 мл", price: 400 },
        { id: "1000", name: "1000 мл", price: 450 },
      ],
    },
    lem850: {
      id: "lem850",
      title: "Объём",
      multi: false,
      required: true,
      replacesPrice: true,
      options: [
        { id: "350", name: "350 мл", price: 400 },
        { id: "1000", name: "1000 мл", price: 850 },
      ],
    },
    teaWarm: {
      id: "teaWarm",
      title: "Дополнения к согревающим напиткам",
      multi: true,
      options: [
        { id: "citrus", name: "Лимон/апельсин", price: 100 },
        { id: "lime", name: "Лайм", price: 100 },
        { id: "milk", name: "Молоко 100 мл", price: 150 },
        { id: "honey", name: "Мёд", price: 120 },
        { id: "mint", name: "Мята", price: 100 },
        { id: "syrup", name: "Сироп", price: 100 },
      ],
    },
    altMilk: {
      id: "altMilk",
      title: "Молоко",
      multi: false,
      options: [{ id: "alt", name: "Альтернативное молоко", price: 150 }],
    },
  },
  items: [],
};

(function build() {
  const M = window.MENU;
  const items = [];
  let n = 0;
  function add(item) {
    n += 1;
    items.push(Object.assign({ id: "m" + n }, item));
  }

  const burgers = [
    ["Фирменный бургер МК", 740, "Говяжья котлета, бекон, картофель фри, томаты маринованные, луковые кольца, халапеньо, маринованный огурец, соус, салат, лук, сыр чеддер.", ["Халапеньо", "Бекон", "Картофель фри", "Томаты маринованные", "Луковые кольца", "Маринованный огурец", "Соус", "Салат", "Лук", "Сыр чеддер"]],
    ["Бургер КО-КО", 590, "Куриная грудка в хрустящей панировке, картофель фри, коу-слоу, халапеньо, соус.", ["Куриная грудка", "Картофель фри", "Коу-слоу", "Халапеньо", "Соус"]],
    ["BEEF Бургер", 670, "Говяжья котлета, картофель фри, яйцо, маринованный огурец, томаты, лук, сыр чеддер, салат, соус.", ["Говяжья котлета", "Картофель фри", "Яйцо", "Маринованный огурец", "Томаты", "Лук", "Сыр чеддер", "Салат", "Соус"]],
    ["Чизбургер", 650, "Говяжья котлета, кетчуп, лук, сыр чеддер, маринованный огурец, картофель фри.", ["Говяжья котлета", "Кетчуп", "Лук", "Сыр чеддер", "Маринованный огурец", "Картофель фри"]],
    ["Двойной чизбургер", 800, "Две говяжьи котлеты, дижонская горчица, кетчуп, лук, сыр чеддер, булочка.", ["Говяжья котлета", "Дижонская горчица", "Кетчуп", "Лук", "Сыр чеддер", "Булочка"]],
    ["Бургер с тунцом", 650, "Тунец рубленый, томат, огурец, лист салата.", ["Тунец", "Томат", "Огурец", "Лист салата"]],
  ];
  burgers.forEach(([name, price, desc, remove]) =>
    add({ categoryId: "burgers", name, price, description: desc, ingredients: desc, remove, modifierGroups: ["burgerAddons"] })
  );

  add({ categoryId: "sandwiches", name: "Клаб-сендвич с куриной грудкой", price: 590, description: "С куриной грудкой, беконом, хрустящими овощами и картофелем фри.", ingredients: "куриная грудка, бекон, овощи, картофель фри", remove: ["Бекон", "Овощи", "Картофель фри"] });
  add({ categoryId: "sandwiches", name: "Клаб-сендвич с ветчиной", price: 520, description: "С ветчиной, сыром, хрустящими овощами и картофелем фри.", ingredients: "ветчина, сыр, овощи, картофель фри", remove: ["Сыр", "Овощи", "Картофель фри"] });
  add({ categoryId: "sandwiches", name: "Клаб-сендвич с лососем", price: 650, description: "С лососем, свежим огурцом и сливочным сыром.", ingredients: "лосось, огурец, сливочный сыр", remove: ["Огурец", "Сливочный сыр"] });

  add({ categoryId: "snacks", name: "Вителло Тоннато", price: 690, description: "Вителло тоннато.", ingredients: "телятина, соус тоннато" });
  add({ categoryId: "snacks", name: "Селедочка", price: 520, description: "Сельдь, картофель, бородинский хлеб.", ingredients: "сельдь, картофель, бородинский хлеб", remove: ["Картофель", "Бородинский хлеб"] });
  add({ categoryId: "snacks", name: "Коллекция европейских сыров", price: 1190, description: "Пармезан, дор-блю, маасдам, скаморца, орешки, мёд.", ingredients: "пармезан, дор-блю, маасдам, скаморца, орешки, мёд" });
  add({ categoryId: "snacks", name: "Плато мясной гастрономии", price: 1390, description: "Мясная гастрономия.", ingredients: "мясная нарезка" });
  add({ categoryId: "snacks", name: "Разносолы", price: 630, description: "Бочковые огурцы, капуста с душистым маслом, маринованные томаты, мочёный перец, халапеньо.", ingredients: "огурцы, капуста, томаты, перец, халапеньо" });
  add({ categoryId: "snacks", name: "Брускетта с томатами", price: 400, description: "С конкассе из томатов и оливками.", ingredients: "томаты, оливки" });
  add({ categoryId: "snacks", name: "Брускетта с креветками", price: 490, description: "С креветками и гуакамоле.", ingredients: "креветки, гуакамоле" });
  add({ categoryId: "snacks", name: "Брускетта с лососем", price: 550, description: "С лососем слабой соли и сливочным сыром.", ingredients: "лосось, сливочный сыр" });
  add({ categoryId: "snacks", name: "Оливки/Маслины", price: 250, description: "Оливки и маслины.", ingredients: "оливки, маслины" });

  add({ categoryId: "salads", name: "Греческий салат", price: 430, description: "Классический греческий салат.", ingredients: "овощи, фета, оливки" });
  add({
    categoryId: "salads",
    name: "Овощной салат",
    price: 320,
    description: "Заправка: сметана или масло.",
    ingredients: "овощи, сметана, масло",
    modifierGroups: [],
    extraGroups: [
      {
        id: "dressing",
        title: "Заправка",
        multi: false,
        required: true,
        options: [
          { id: "sour", name: "Сметана", price: 0 },
          { id: "oil", name: "Масло", price: 0 },
        ],
      },
    ],
  });
  add({ categoryId: "salads", name: "Цезарь с куриной грудкой", price: 520, description: "Цезарь с курицей.", ingredients: "курица, салат, соус цезарь, пармезан", remove: ["Пармезан", "Соус"] });
  add({ categoryId: "salads", name: "Салат с лососем и грейпфрутом", price: 650, description: "Лосось, авокадо, грейпфрут, микс салата, соус терияки.", ingredients: "лосось, авокадо, грейпфрут, терияки" });
  add({ categoryId: "salads", name: "Цезарь с тигровыми креветками", price: 640, description: "Цезарь с креветками.", ingredients: "креветки, салат, соус цезарь" });
  add({ categoryId: "salads", name: "Тёплый салат с ростбифом", price: 690, description: "Тёплый салат с ростбифом.", ingredients: "ростбиф, салат" });
  add({ categoryId: "salads", name: "Тёплый салат с баклажанами", price: 550, description: "С хрустящими баклажанами и творожным сыром.", ingredients: "баклажаны, творожный сыр" });
  add({ categoryId: "salads", name: "Салат с рукколой и креветками в соусе манго", price: 620, description: "Руккола, королевские креветки, соус манго.", ingredients: "руккола, креветки, манго" });
  add({ categoryId: "salads", name: "Салат с рисовой лапшой и говядиной в азиатском соусе", price: 750, description: "Рисовая лапша, говяжья вырезка, перец, кисло-сладкий соус.", ingredients: "лапша, говядина, перец, соус" });

  add({ categoryId: "soups", name: "Том-Ям с морепродуктами", price: 590, description: "Том-ям с морепродуктами.", ingredients: "морепродукты, том-ям" });
  add({ categoryId: "soups", name: "Суп-лапша с куриной грудкой", price: 350, description: "Лапша с курицей.", ingredients: "лапша, курица" });

  add({ categoryId: "pasta", name: "Спагетти Карбонара", price: 510, description: "Карбонара.", ingredients: "спагетти, бекон, пармезан, желток", remove: ["Бекон", "Пармезан"] });
  add({ categoryId: "pasta", name: "Спагетти Олифе", price: 590, description: "Креветки, вяленые помидоры, оливки.", ingredients: "креветки, вяленые помидоры, оливки" });
  add({ categoryId: "pasta", name: "Паста с мидиями", price: 750, description: "Спагетти, мидии, сливочный соус, пармезан.", ingredients: "мидии, сливки, пармезан" });
  add({ categoryId: "pasta", name: "Паста Птитим с креветкой", price: 650, description: "Паста птитим, креветка, сливки, пармезан.", ingredients: "птитим, креветка, сливки, пармезан" });
  add({ categoryId: "pasta", name: "Ньокки с креветками и творожным сыром", price: 570, description: "Ньокки, креветки, творожный сыр.", ingredients: "ньокки, креветки, творожный сыр" });
  add({ categoryId: "pasta", name: "Ньокки с говяжьей вырезкой", price: 570, description: "Ньокки с говядиной.", ingredients: "ньокки, говядина" });
  add({ categoryId: "pasta", name: "Фетучини с тигровыми креветками", price: 570, description: "В сливочном соусе.", ingredients: "фетучини, креветки, сливки" });
  add({ categoryId: "pasta", name: "Фетучини с лососем", price: 620, description: "Фетучини с лососем.", ingredients: "фетучини, лосось" });
  add({ categoryId: "pasta", name: "Фетучини с куриной грудкой и грибами", price: 520, description: "Курица и грибы.", ingredients: "фетучини, курица, грибы" });

  add({ categoryId: "tori", name: "Тори-Тяхан с тигровыми креветками", price: 590, description: "Рис с креветками.", ingredients: "рис, креветки" });
  add({ categoryId: "tori", name: "Тори-Тяхан с говядиной", price: 620, description: "Рис с говядиной.", ingredients: "рис, говядина" });
  add({ categoryId: "tori", name: "Тори-Тяхан с курицей", price: 550, description: "Рис с курицей.", ingredients: "рис, курица" });

  add({ categoryId: "wok", name: "Удон с тигровыми креветками и овощами", price: 580, description: "Удон, креветки, овощи.", ingredients: "удон, креветки, овощи" });
  add({ categoryId: "wok", name: "Удон с куриной грудкой и овощами", price: 520, description: "Удон, курица, овощи.", ingredients: "удон, курица, овощи" });

  add({ categoryId: "frit", name: "Картофель фри", price: 260, description: "Картофель фри.", ingredients: "картофель" });
  add({ categoryId: "frit", name: "Картофельные дольки", price: 280, description: "Картофельные дольки.", ingredients: "картофель" });

  function frit(name, sizes, freeFrom) {
    add({
      categoryId: "frit",
      name,
      price: sizes[0][1],
      description: sizes.map((s) => s[0] + " — " + s[1] + " ₽").join(", ") + (freeFrom ? ". К " + freeFrom + " любой соус бесплатно." : ""),
      ingredients: name,
      modifierGroups: [],
      extraGroups: [
        {
          id: "size-" + name,
          title: "Количество",
          multi: false,
          required: true,
          replacesPrice: true,
          options: sizes.map((s, i) => ({
            id: "sz" + i,
            name: s[0],
            price: s[1],
            freeSauce: freeFrom != null && parseInt(s[0], 10) >= freeFrom,
          })),
        },
        M.groups.sauces,
      ],
      sauceWhen: "freeSauce",
    });
  }
  frit("Сырные шарики", [["6 шт.", 360], ["9 шт.", 540], ["12 шт.", 690]], 12);
  frit("Наггетсы", [["6 шт.", 360], ["9 шт.", 540], ["12 шт.", 600]], 12);
  frit("Луковые кольца", [["6 шт.", 300], ["9 шт.", 450], ["12 шт.", 550]], 12);
  frit("Креветки темпура", [["6 шт.", 600], ["12 шт.", 1100], ["18 шт.", 1600]], 12);
  add({ categoryId: "frit", name: "Плато «Фритерия»", price: 1290, description: "Картофель фри, сырные палочки, наггетсы, луковые кольца, стрипсы. Каждая позиция по 5 шт.", ingredients: "фри, сырные палочки, наггетсы, луковые кольца, стрипсы" });
  add({ categoryId: "frit", name: "«Бородинские» гренки", price: 350, description: "С чесноком, пармезаном и сметанным соусом.", ingredients: "бородинский хлеб, чеснок, пармезан, сметана" });
  frit("Стрипсы", [["6 шт.", 400], ["9 шт.", 550], ["12 шт.", 750]], 12);
  add({ categoryId: "frit", name: "Попкорн из креветок в соусе свит-чили", price: 590, description: "Королевские креветки, панировка, соус свит-чили.", ingredients: "креветки, свит-чили" });

  add({ categoryId: "hot", name: "Стейк лосося в устричном соусе", price: 1390, description: "Лосось, булгур, сливки и устричный соус.", ingredients: "лосось, булгур, сливки, устричный соус" });
  add({ categoryId: "hot", name: "Куриное филе в крем-чиз-песто", price: 670, description: "Куриное филе, песто, крем-чиз.", ingredients: "курица, песто, крем-чиз" });
  add({ categoryId: "hot", name: "Строганов", price: 630, description: "С куриной грудкой, грибами и картофелем бейби.", ingredients: "курица, грибы, картофель бейби" });
  add({ categoryId: "hot", name: "Говядина с овощами", price: 1190, description: "Говядина с овощами.", ingredients: "говядина, овощи" });
  add({ categoryId: "hot", name: "Шницель из курицы", price: 590, description: "С сыром и картофелем бейби.", ingredients: "курица, сыр, картофель бейби" });
  add({ categoryId: "hot", name: "Медальоны", price: 1290, description: "Из говяжьей вырезки и картофелем бейби.", ingredients: "говядина, картофель бейби" });
  add({ categoryId: "hot", name: "Жаркое из курицы", price: 700, description: "Жаркое из курицы.", ingredients: "курица" });
  add({ categoryId: "hot", name: "Мидии в соусе дор блю", price: 890, description: "Мидии в панцире, сливки, сыр дор блю, чиабатта.", ingredients: "мидии, дор блю, чиабатта" });
  add({ categoryId: "hot", name: "Мидии в сливочном соусе", price: 850, description: "Мидии в панцире, сливки, чиабатта.", ingredients: "мидии, сливки, чиабатта" });

  add({
    categoryId: "desserts",
    name: "Морковное",
    price: 370,
    description: "Бисквит, шоколад, клубника — с топпингом на выбор.",
    ingredients: "бисквит, шоколад, клубника",
    extraGroups: [
      {
        id: "topping",
        title: "Топпинг",
        multi: false,
        options: [
          { id: "choc", name: "Шоколад", price: 0 },
          { id: "berry", name: "Ягодный", price: 0 },
          { id: "caramel", name: "Карамель", price: 0 },
        ],
      },
    ],
  });
  add({ categoryId: "desserts", name: "Сырники со взбитой сгущёнкой", price: 390, description: "Сырники со сгущёнкой.", ingredients: "сырники, сгущёнка" });
  add({ categoryId: "desserts", name: "Чизкейк", price: 460, description: "Чизкейк.", ingredients: "чизкейк" });
  add({ categoryId: "desserts", name: "Фрукты", price: 1400, description: "Наполняемость по сезону.", ingredients: "фрукты", extraGroups: [M.groups.fruitSize] });

  add({ categoryId: "bar", name: "Вода в стекле", price: 240, description: "Газированная или негазированная.", ingredients: "вода", extraGroups: [M.groups.water] });
  add({ categoryId: "bar", name: "Сок в ассортименте", price: 220, description: "Сок, два объёма.", ingredients: "сок", extraGroups: [M.groups.juice] });

  const lems = [
    ["Мохито классический клубничный б/а", "lemMojito"],
    ["Цитрусовый лимонад", "lem350"],
    ["Лимонад киви-фейхоа", "lem350"],
    ["Лимонад ананас-кокос", "lem350"],
    ["Лимонад гранат-смородина", "lem350"],
    ["Лимонад дыня-кумкват", "lem350"],
    ["Лимонад вишня-яблоко", "lem350"],
    ["Лимонад грейпфрут-моджевельник", "lem350"],
    ["Лимонад манго-маракуйя", "lem850"],
    ["Лимонад ежевика-фиалка", "lem350"],
    ["Лимонад виноград-малина", "lem350"],
    ["Лимонад киви-базилик", "lem350"],
    ["Лимонад облепиха и пряный лимон", "lem850"],
    ["Лимонад черника-лаванда", "lem850"],
  ];
  lems.forEach(([name, g]) =>
    add({
      categoryId: "lemonades",
      name,
      price: M.groups[g].options[0].price,
      description: "350 мл / 1000 мл",
      ingredients: name,
      extraGroups: [M.groups[g]],
    })
  );

  [["Кола стекло", 330], ["Фанта", 270], ["Спрайт", 270], ["Тоник", 270]].forEach(([name, price]) =>
    add({ categoryId: "bottled", name, price, description: name, ingredients: name })
  );
  [["Берн", 250], ["Ред Булл", 350]].forEach(([name, price]) =>
    add({ categoryId: "energy", name, price, description: name, ingredients: name })
  );
  [
    ["Страковице", 350, "В ассортименте."],
    ["Крушовице", 330, ""],
    ["Сидр Честер", 350, "В ассортименте."],
    ["Корона с лаймом", 550, ""],
    ["Гинесс", 590, ""],
    ["Либенвайс", 700, ""],
    ["Пиво разлив", 390, ""],
  ].forEach(([name, price, desc]) =>
    add({ categoryId: "beer", name, price, description: desc || name, ingredients: name })
  );

  add({ categoryId: "tea", name: "Ассам/Сенча", price: 500, description: "Классический чай.", ingredients: "чай", modifierGroups: ["teaWarm"] });
  add({ categoryId: "tea", name: "Эрл Грей, с жасмином", price: 550, description: "Классический чай.", ingredients: "эрл грей, жасмин", modifierGroups: ["teaWarm"] });
  [["Улун", 750], ["Белый чай", 800], ["Габа", 850], ["Красный чай", 750], ["Шу Пуэр", 800]].forEach(([name, price]) =>
    add({ categoryId: "tea", name, price, description: "Китайский чай.", ingredients: name, modifierGroups: ["teaWarm"] })
  );
  [["Чай с пряным имбирём", 700], ["Пряная облепиха", 700], ["Клюква-апельсин", 700], ["Вишнёвый пунш", 900], ["Лесные ягоды", 700]].forEach(([name, price]) =>
    add({ categoryId: "tea", name, price, description: "Авторский чай.", ingredients: name, modifierGroups: ["teaWarm"] })
  );

  function coffee(cat, name, price, desc) {
    add({
      categoryId: cat,
      name,
      price,
      description: (desc || name) + " Альтернативное молоко +150 ₽.",
      ingredients: name,
      modifierGroups: ["altMilk"],
    });
  }
  [["Эспрессо", 250], ["Американо", 250], ["Капучино", 330], ["Латте", 380]].forEach(([n, p]) => coffee("coffee", n, p));
  [["Клубника-базилик", 450], ["Фисташка-ваниль", 430], ["Крем-брюле", 430], ["Малина-кокос", 450], ["Карамель", 430], ["Какао Бергамот-Черника", 400]].forEach(([n, p]) => coffee("author-coffee", n, p));
  [["Клубника-Матча", 450], ["Матча Фисташка-Яблоко", 430]].forEach(([n, p]) => coffee("matcha", n, p));
  [["Айс-латте", 360], ["Бамбл (вишня-апельсин)", 390], ["Латте банан-кокос", 490]].forEach(([n, p]) => coffee("cold-coffee", n, p));

  [["Арахис", 170], ["Фисташки", 380], ["Кешью", 280], ["Шоколад", 300], ["Чипсы", 350]].forEach(([name, price]) =>
    add({ categoryId: "nuts", name, price, description: name, ingredients: name })
  );

  M.items = items;
})();

window.TABLES = (function () {
  const list = [];
  for (let i = 1; i <= 30; i++) list.push({ id: "t" + i, zone: "main", label: "Стол " + i, short: String(i) });
  for (let i = 1; i <= 3; i++) list.push({ id: "vip" + i, zone: "vip", label: "VIP " + i, short: "VIP " + i });
  return list;
})();
