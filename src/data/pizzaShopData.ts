import { BlogPost, MenuCategory, StoreHours } from '../types';

export const STORE_HOURS: StoreHours[] = [
  {
    day: 'Monday',
    hours: 'Closed',
    statusNote: 'Dough mixing & cold cellar resting day',
    isClosed: true,
  },
  {
    day: 'Tuesday',
    hours: 'Closed',
    statusNote: 'Long fermentation in progress (Batch 1)',
    isClosed: true,
  },
  {
    day: 'Wednesday',
    hours: '4:30 PM – 9:30 PM',
    statusNote: '72-Hour aged dough available',
    isClosed: false,
  },
  {
    day: 'Thursday',
    hours: '4:30 PM – 9:30 PM',
    statusNote: '72-Hour aged dough available',
    isClosed: false,
  },
  {
    day: 'Friday',
    hours: '4:00 PM – 10:30 PM',
    statusNote: 'Weekend batch • Limited supply',
    isClosed: false,
  },
  {
    day: 'Saturday',
    hours: '4:00 PM – 10:30 PM',
    statusNote: 'Weekend batch • Limited supply',
    isClosed: false,
  },
  {
    day: 'Sunday',
    hours: '3:30 PM – 9:00 PM',
    statusNote: 'Sunday supper service',
    isClosed: false,
  },
];

export const MENU_CATEGORIES: MenuCategory[] = [
  {
    id: 'neapolitan-pies',
    title: 'Neapolitan Pizzas (Pizze Napoletane)',
    subtitle: 'Strict Neapolitan discipline: hand-crushed San Marzano D.O.P. tomatoes, fresh basil, 72-hour cold-fermented dough, flash-baked in 90 seconds at 900°F',
    items: [
      {
        id: 'margherita-verace',
        name: 'Margherita Verace D.O.P.',
        italianName: 'Pizza Margherita Tradizionale',
        description: 'Crushed San Marzano D.O.P. tomatoes, fresh fior di latte mozzarella d’Agerola, aged pecorino romano, organic Genovese basil, cold-pressed extra virgin olive oil.',
        price: 19,
        isVegetarian: true,
        tags: ['Neapolitan Classic', 'Vegetarian'],
      },
      {
        id: 'marinara-antica',
        name: 'Marinara Antica (Est. 1734)',
        italianName: 'Pizza Marinara Tradizionale',
        description: 'Slow-simmered San Marzano tomatoes, thinly shaved fresh garlic, wild Sicilian mountain oregano, sea salt, cold-pressed olive oil. No cheese.',
        price: 16,
        isVegan: true,
        isVegetarian: true,
        tags: ['Ancient Classic', 'Vegan', 'Dairy-Free'],
      },
      {
        id: 'bufalina-campana',
        name: 'Bufalina D.O.P.',
        italianName: 'Margherita con Mozzarella di Bufala',
        description: 'San Marzano D.O.P. tomatoes, fresh creamy Mozzarella di Bufala Campana flown in weekly, torn fresh sweet basil, coarse Sicilian sea salt, EVOO.',
        price: 23,
        isVegetarian: true,
        tags: ['House Specialty', 'Vegetarian'],
      },
      {
        id: 'cosacca-storica',
        name: 'La Cosacca (Historic 1844)',
        italianName: 'Antica Pizza Cosacca',
        description: 'Crushed sweet San Marzano tomatoes, abundant grated 18-month Pecorino Romano D.O.P., fresh sweet basil, cracked black pepper, extra virgin olive oil. The historic minimalist street pizza of Naples.',
        price: 17,
        isVegetarian: true,
        tags: ['Historic Recipe', 'Vegetarian'],
      },
      {
        id: 'diavola-napoletana',
        name: 'Diavola Napoletana',
        italianName: 'Pizza alla Diavola con Peperoncino',
        description: 'San Marzano D.O.P. sauce, smoked provola affumicata cheese, artisan spicy salame napoletano, crushed fermented Calabrian hot chili paste, wild mountain oregano.',
        price: 22,
        tags: ['Spicy', 'House Favorite'],
      },
      {
        id: 'capricciosa-napoletana',
        name: 'Capricciosa Napoletana',
        italianName: 'Pizza Capricciosa Tradizionale',
        description: 'San Marzano tomato base, fior di latte, artisanal prosciutto cotto (rosemary ham), wood-roasted cremini mushrooms, tender artichoke hearts, Gaeta black olives.',
        price: 24,
        tags: ['Traditional'],
      },
    ],
  },
  {
    id: 'small-plates',
    title: 'Small Plates & Fresh Greens',
    subtitle: 'Artisan accompaniments prepared with wood-fired hearth techniques',
    items: [
      {
        id: 'castelfranco-salad',
        name: 'Castelfranco & Shaved Parmigiano',
        italianName: 'Insalata di Radicchio',
        description: 'Speckled Castelfranco radicchio, shaved 24-month Parmigiano-Reggiano, toasted pine nuts, white Modena balsamic vinaigrette.',
        price: 14,
        isVegetarian: true,
        tags: ['Gluten-Free', 'Vegetarian'],
      },
      {
        id: 'aged-dough-focaccia',
        name: 'Warm 72-Hour Focaccia & Cultured Butter',
        italianName: 'Focaccia della Casa al Burro Nocciola',
        description: 'Hearth-baked wedge of our signature 72-hour dough topped with rosemary, sea salt, served with house-whipped cultured honey-herb butter.',
        price: 10,
        isVegetarian: true,
        tags: ['Signature Dough'],
      },
      {
        id: 'marinated-olives',
        name: 'Wood-Warmed Castelvetrano Olives',
        italianName: 'Olive Calde Condite',
        description: 'Vibrant green Sicilian olives gently warmed in the oven mouth with preserved lemon peel, cracked coriander, and wild fennel.',
        price: 8,
        isVegan: true,
        isVegetarian: true,
        tags: ['Vegan', 'Gluten-Free'],
      },
    ],
  },
  {
    id: 'beverages',
    title: 'Non-Alcoholic Refreshments',
    subtitle: 'Traditional Italian sodas, sparkling mountain mineral water, and house herbal infusions',
    items: [
      {
        id: 'san-pellegrino-sparkling',
        name: 'Italian Sparkling Mineral Water (750ml)',
        description: 'Bottled at the source in San Pellegrino Terme, crisp fine effervescence.',
        price: 6,
        isVegan: true,
      },
      {
        id: 'chinotto-soda',
        name: 'Artisanal Chinotto & Aranciata Amara',
        description: 'Bitter citrus Sicilian herbal soda brewed with Ligurian myrtle-leaf orange extracts.',
        price: 5,
        isVegan: true,
      },
      {
        id: 'sicilian-lemonade',
        name: 'Fresh Sicilian Meyer Lemon & Rosemary Soda',
        description: 'Hand-squeezed Meyer lemons, crushed garden rosemary syrup, and sparkling spring water.',
        price: 5,
        isVegan: true,
        tags: ['House-Made'],
      },
      {
        id: 'blood-orange-iced-tea',
        name: 'Cold-Brewed Hibiscus & Blood Orange Tea',
        description: 'Unsweetened slow cold-steeped wild hibiscus flowers, dried blood orange peel, and fresh mint sprig.',
        price: 5,
        isVegan: true,
        tags: ['House-Made'],
      },
    ],
  },
];

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 'importance-of-dough-aging',
    slug: 'importance-of-dough-aging',
    title: 'The Architecture of Time: Why We Age Our Dough for 72 Hours',
    subtitle: 'Most pizza dough is rushed in four hours. Here is what happens when you wait three full days.',
    author: 'Marco Bellini',
    authorRole: 'Head Baker & Pizzaiolo',
    readTime: '4 min read',
    publishedDate: 'September 14, 2026',
    artType: 'dough',
    excerpt: 'Long cold fermentation is not a marketing hook—it is the biological transformation of starch, gluten, and complex sugars into an airy, easily digestible crust.',
    keyTakeaways: [
      'Protease enzymes predigest complex gluten proteins over 72 hours, drastically reducing bloating and heaviness.',
      'Lactic and acetic acid bacteria create deep, complex rustic notes impossible in quick-rise doughs.',
      'Cold cellar temperatures (38°F–40°F) restrain rapid yeast inflation, allowing micro-blistering and honeycomb alveoli to develop.',
    ],
    content: [
      {
        sectionHeading: 'The Rush of Modern Commercial Dough',
        paragraphs: [
          'In modern commercial pizza shops, dough is treated as an inconvenience to be hurried. Commercial bakeries dump massive quantities of isolated baker’s yeast, sugar, and warm water into industrial spiral mixers, forcing the dough to balloon to twice its size within ninety minutes to three hours.',
          'While this rapid rise creates volume, it accomplishes almost none of the real biological work. The flour’s starches remain dense and intact; the complex gluten matrix remains rigid and difficult for the human stomach to break down; and the flavor profile is dominated by a harsh, one-dimensional ethanol yeastiness.',
        ],
        quote: 'Speed is the enemy of flavor and digestibility. You cannot negotiate with biochemistry.',
      },
      {
        sectionHeading: 'What Happens Inside the 38°F Cellar',
        paragraphs: [
          'When we mix our dough, we introduce less than 0.05% commercial yeast, relying instead on a living mother culture and a high-hydration matrix. Once balled, the dough immediately enters our temperature-controlled cold cellar held strictly between 38°F and 40°F (3°C to 4°C).',
          'At this temperature, the yeast enters a semi-dormant state, producing carbon dioxide at an imperceptible trickle. But while the yeast rests, the enzymes in the flour—specifically amylase and protease—wake up and begin their quiet masterpiece.',
          'Amylase enzymes gently dismantle the long, complex chains of wheat starch into simple, natural sugars (maltose and glucose). Protease enzymes steadily tenderize the dense gluten web, clipping peptide bonds. Simultaneously, wild lactic acid bacteria slowly produce lactic and acetic organic acids.',
        ],
      },
      {
        sectionHeading: 'The Result on Your Plate and in Your Stomach',
        paragraphs: [
          'When this 72-hour aged dough meets our 900°F wood-fired stone oven floor, the simple sugars instantly caramelize into tiny, dark, leopard-spotted micro-blisters without ever charring bitter.',
          'The liberated moisture turns instantly to high-pressure steam, lifting the crust into an airy, cloud-like cornicione with a web of translucent, honeycomb pockets (alveoli). It is crisp on the exterior, featherlight within, and naturally predigested. You can finish an entire 12-inch pie and walk away feeling energized, light, and comfortable.',
        ],
      },
    ],
  },
  {
    id: 'flour-selection-philosophy',
    slug: 'flour-selection-philosophy',
    title: 'The Grain Matters: Our Philosophy on Flour Selection',
    subtitle: 'Why we blend imported Italian Type 00 wheat with regional stone-milled heritage grains.',
    author: 'Elena Rossi',
    authorRole: 'Master Miller & Co-Founder',
    readTime: '5 min read',
    publishedDate: 'September 08, 2026',
    artType: 'oven',
    excerpt: 'A dough fermented for three days will destroy weak flours. Here is how we balance protein strength, ash content, and ancient grain aromatics.',
    keyTakeaways: [
      'Standard roller-milled all-purpose flours collapse under 72 hours of enzyme activity; high-strength (W300+) flour is essential.',
      'Imported Italian Tipo 00 provides unyielding elasticity, fine silkiness, and thermal resistance in a 900°F oven.',
      'We incorporate 15% freshly stone-milled heritage Red Fife wheat to reintroduce wheat germ oils, mineral depth, and rustic aroma.',
    ],
    content: [
      {
        sectionHeading: 'The Myth of "All Flour Is Equal"',
        paragraphs: [
          'To the casual eye, all white flour looks identical—a fine pale dust. But to a baker, flour is an intricate living ecosystem defined by protein quality, ash content, falling number, and grain heritage.',
          'When a recipe calls for aging dough for 72 hours, using standard supermarket all-purpose flour or low-protein pastry flour will result in catastrophe. The active protease enzymes will chew through the weak gluten strands, and by day three, the dough will liquefy into a sticky, unworkable pool that tears upon contact with the peel.',
        ],
        quote: 'You cannot make an extraordinary pizza out of lifeless, bleached flour. The grain must have character, strength, and memory.',
      },
      {
        sectionHeading: 'The Italian Tipo "00" Foundation',
        paragraphs: [
          'The backbone of our formula (85%) is an unbleached, non-GMO Italian Tipo "00" flour milled from the central heart of selected soft winter wheats. The "00" designation does not measure protein; it measures ash content—indicating the most meticulously sifted, purest endosperm.',
          'We specifically source a grain with an Alveograph W-index rating of 320 to 340 and a balanced P/L ratio (elasticity to extensibility). This extraordinary strength allows the gluten mesh to withstand three continuous days of enzymatic softening while still stretching paper-thin without snapping back like rubber.',
        ],
      },
      {
        sectionHeading: 'The 15% Secret: Heritage Stone-Milled Grain',
        paragraphs: [
          'Pure industrial Tipo 00 flour produces an immaculate crust texture, but because the germ and bran are sifted away, it can lack genuine rustic wheat soul. That is why we blend in 15% stone-milled heritage Red Fife wheat sourced directly from regional family farms.',
          'Stone milling operates at low friction temperatures, preserving the live wheat germ and its aromatic essential fatty acids. During our 72-hour cold aging, these intact lipids and complex bran particles gently ferment, imbuing the final bake with notes of toasted hazelnut, sweet malt, and countryside earth.',
          'No chemical preservatives. No bromate conditioners. No malted barley extract to fake browning. Just water, salt, patience, and whole, honest grain.',
        ],
      },
    ],
  },
];
