export const SHOP_INFO = {
    name: 'SJ Home Interiors',
    tagline: 'Maltby Showroom & Online Collection',
    address: 'High Street, Maltby, Rotherham, S66 8JE',
    street: 'High Street',
    town: 'Maltby',
    city: 'Rotherham',
    county: 'South Yorkshire',
    postcode: 'S66 8JE',
    phone: '07830141250',
    phoneFormatted: '07830 141250',
    email: 'info@sjhomeinteriors.co.uk',
    hours: 'Mon–Sat: 10:00 AM – 5:00 PM | Sun: 11:00 AM – 4:00 PM',
};

export const colorMap = {
    Beige: '#D8CFC2',
    Cream: '#F3EFE6',
    Ivory: '#FFFFF0',
    White: '#F9F9F9',
    'White Marble': '#F2F0EB',
    Grey: '#8C8C8C',
    'Light Grey': '#C4C4C4',
    'Silver Grey': '#B2B5B8',
    Charcoal: '#3E4042',
    Anthracite: '#292C2F',
    Black: '#1C1B18',
    Blue: '#2B547E',
    'Navy Blue': '#1B2A4A',
    'Royal Blue': '#1E3F8B',
    'Sky Blue': '#7BAFD4',
    Teal: '#1F5F61',
    Green: '#3B5249',
    'Sage Green': '#8A9A86',
    'Emerald Green': '#184A3B',
    'Forest Green': '#233D2C',
    Olive: '#556B2F',
    Taupe: '#8B7D70',
    Mink: '#A8998C',
    Champagne: '#E6D7C3',
    Brown: '#5C4033',
    Tan: '#B87333',
    Cognac: '#8F4B2D',
    Walnut: '#4B3621',
    'Natural Oak': '#C8A165',
    'Rustic Oak': '#9E7344',
    Gold: '#C5A059',
    'Brushed Brass': '#B59449',
    Chrome: '#D4D7D9',
    'Blush Pink': '#E3BCBC',
    Mustard: '#D49B27',
    Terracotta: '#B85D43',
    Plum: '#583149',
};

// Default variation presets (Admin can add or delete any of these in the dashboard)
export const VARIATION_PRESETS = {
    fabrics: [
        'Linoso',
        'Marble',
        'Naples',
        'Plush Velvet',
        'Spice Velvet',
        'Teddy',
        'Wool',
    ],
    sizesByCategory: {
        Beds: [
            '2ft 6in Small Single (75 × 190 cm)',
            '3ft Single (90 × 190 cm)',
            '4ft Small Double (120 × 190 cm)',
            '4ft 6in Double (135 × 190 cm)',
            '5ft King (150 × 200 cm)',
            '6ft Super King (180 × 200 cm)',
        ],
        Sofas: [
            'Armchair (3ft 6in / 105 cm)',
            '2 Seater (5ft 7in / 170 cm)',
            '3 Seater (6ft 11in / 210 cm)',
            '3+2 Sofa Set',
            'Corner Sofa (8ft × 8ft / 245 × 245 cm)',
            'U-Shape Sofa (10ft 8in / 326 cm)',
        ],
        Wardrobes: [
            '3ft 11in / 120 cm Wide',
            '4ft 11in / 150 cm Wide',
            '5ft 11in / 180 cm Wide',
            '6ft 8in / 203 cm Wide',
            '8ft 2in / 250 cm Wide',
        ],
        Tables: [
            '4ft 7in / 140 cm (4–6 Seater)',
            '5ft 3in / 160 cm (6 Seater)',
            '5ft 11in / 180 cm (6–8 Seater)',
            '6ft 7in / 200 cm (8 Seater)',
        ],
        default: [
            '3ft (90 cm)',
            '4ft (120 cm)',
            '4ft 6in (135 cm)',
            '5ft (150 cm)',
            '6ft (180 cm)',
        ],
    },
    mattresses: [
        'No Mattress (Frame Only)',
        'Orthopaedic',
        'Super Orthopaedic',
        'Roma Pillow Top',
        'Pocket Spring',
        'Natural Haven',
        'Reflex Elite',
        'Blue Wave Hybrid',
        'Frostflex',
        'Comfort Deluxe Pillow',
    ],
    liftOptions: ['Standard Base (No Lift)', 'End Lift Ottoman', 'Side Lift Ottoman'],
};

/**
 * Determines which variation groups are relevant for a given furniture category.
 * Prevents showing Mattresses or Gas-Lift options on Tables, Wardrobes, or Cabinets.
 */
export function getCategoryVariationConfig(category = '', subcategory = '') {
    const cat = category.toLowerCase();
    const sub = subcategory.toLowerCase();

    if (cat === 'beds' || cat.includes('bed')) {
        return {
            showFabrics: true,
            showSizes: true,
            showMattresses: !sub.includes('mattress'),
            showLiftOptions: !sub.includes('mattress'),
        };
    }
    if (cat === 'sofas' || cat.includes('sofa') || cat === 'chairs' || cat.includes('chair')) {
        return {
            showFabrics: true,
            showSizes: true,
            showMattresses: false,
            showLiftOptions: false,
        };
    }
    if (
        cat === 'tables' ||
        cat === 'wardrobes' ||
        cat === 'cabinets' ||
        cat === 'outdoor'
    ) {
        return {
            showFabrics: false,
            showSizes: true,
            showMattresses: false,
            showLiftOptions: false,
        };
    }
    // Custom categories default to Sizes & Fabrics
    return {
        showFabrics: true,
        showSizes: true,
        showMattresses: false,
        showLiftOptions: false,
    };
}

export const CATEGORY_TAXONOMY = {
    Sofas: [
        'U-Shape Sofas',
        'Corner Sofas',
        '3+2 Sofa Sets',
        'Sofa Beds',
        'Recliners',
        'Armchairs',
    ],
    Beds: [
        'Ottoman Beds',
        'Wingback Beds',
        'Divan Beds',
        'Bed Frames',
        'Mattresses',
    ],
    Tables: [
        'Dining Tables',
        'Coffee Tables',
        'Console Tables',
        'Side Tables',
        'Dining Sets',
    ],
    Chairs: ['Dining Chairs', 'Accent Chairs', 'Bar Stools', 'Office Chairs'],
    Wardrobes: [
        'Sliding Wardrobes',
        'Hinged Wardrobes',
        'Mirrored Wardrobes',
        'Bedroom Sets',
    ],
    Cabinets: [
        'Sideboards',
        'TV Units',
        'Chest of Drawers',
        'Bookcases',
        'Display Cabinets',
    ],
    Outdoor: ['Garden Sofa Sets', 'Patio Dining', 'Egg Chairs'],
};

export const categories = [
    { id: 'All', label: 'All Collections' },
    { id: 'Popular', label: '★ Popular' },
    { id: 'Trending', label: '🔥 Trending' },
    { id: 'Sofas', label: 'Sofas' },
    { id: 'Beds', label: 'Beds' },
    { id: 'Tables', label: 'Tables' },
    { id: 'Chairs', label: 'Chairs' },
    { id: 'Wardrobes', label: 'Wardrobes' },
    { id: 'Cabinets', label: 'Cabinets' },
    { id: 'Outdoor', label: 'Outdoor' },
];

export const initialProducts = [
    {
        id: 'luna-u-shape',
        name: 'Luna U-Shape Modular Sofa Bed',
        price: 1399.0,
        previousPrice: 1699.0,
        description:
            'Designed for generous family living, the Luna U-Shape transforms effortlessly into a spacious guest sleeper with hidden under-chaise storage compartments and multi-position ratcheted headrests.',
        category: 'Sofas',
        subcategory: 'U-Shape Sofas',
        badge: 'Bestseller',
        stock: 6,
        isPopular: true,
        isTrending: true,
        delivery: '2–10 days',
        colors: ['Beige', 'Black', 'Green', 'Grey'],
        image:
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85',
            'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1000&q=85',
            'https://images.unsplash.com/photo-1540574163026-643ea20ade25?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: [
            'Length: 326 cm (10ft 8in) | Width: 166 cm (5ft 5in) | Depth: 94 cm (3ft 1in)',
            'Sleeping Area: 263 × 117 cm (8ft 8in × 3ft 10in)',
        ],
        features: [
            'Pull-out U-Shape sleeper transformation',
            'Dual hidden storage chaises',
            'Adjustable multi-position headrests',
            'High-density reflex foam seat cushions',
        ],
        variations: {
            fabrics: ['Linoso', 'Plush Velvet', 'Naples', 'Teddy'],
            sizes: ['U-Shape Sofa (10ft 8in / 326 cm)'],
            mattresses: [],
            liftOptions: [],
            priceDeltas: {
                fabrics: { Teddy: 50 },
                sizes: {},
                mattresses: {},
                liftOptions: {},
            },
            structuredDimensions: {
                default: {
                    length: '326 cm (10ft 8in)',
                    width: '166 cm (5ft 5in)',
                    depth: '94 cm (3ft 1in)',
                    custom: 'Sleeping Area: 263 × 117 cm | Seat Height: 45 cm (18in)',
                },
                bySize: {},
            },
        },
    },
    {
        id: 'kensington-wingback-ottoman-bed',
        name: 'Kensington Wingback Gas-Lift Ottoman Bed',
        price: 649.0,
        previousPrice: 799.0,
        description:
            'Handcrafted in the UK with a deep fluted wingback headboard and heavy-duty hydraulic gas-lift storage base. Customise your fabric, size, lift orientation, and optional orthopaedic mattress.',
        category: 'Beds',
        subcategory: 'Ottoman Beds',
        badge: 'Showroom Favourite',
        stock: 9,
        isPopular: true,
        isTrending: true,
        delivery: '2–7 days',
        colors: ['Cream', 'Grey', 'Charcoal', 'Taupe', 'Navy Blue'],
        image:
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1000&q=85',
            'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: [
            'Length: 205 cm (6ft 9in) | Width: 148 cm (4ft 10in) | Depth: 137 cm (4ft 6in)',
            'Underbed Storage Depth: 28 cm (11in)',
        ],
        features: [
            'Heavy-duty hydraulic gas-lift underbed storage base',
            'Hand-tufted deep fluted wingback headboard',
            'Solid hardwood reinforced frame',
        ],
        variations: {
            fabrics: [
                'Plush Velvet',
                'Naples',
                'Linoso',
                'Spice Velvet',
                'Teddy',
                'Wool',
            ],
            sizes: [
                '3ft Single (90 × 190 cm)',
                '4ft Small Double (120 × 190 cm)',
                '4ft 6in Double (135 × 190 cm)',
                '5ft King (150 × 200 cm)',
                '6ft Super King (180 × 200 cm)',
            ],
            mattresses: [
                'No Mattress (Frame Only)',
                'Orthopaedic',
                'Super Orthopaedic',
                'Pocket Spring',
                'Roma Pillow Top',
                'Blue Wave Hybrid',
            ],
            liftOptions: ['End Lift Ottoman', 'Side Lift Ottoman'],
            priceDeltas: {
                sizes: {
                    '3ft Single (90 × 190 cm)': -50,
                    '4ft Small Double (120 × 190 cm)': 0,
                    '4ft 6in Double (135 × 190 cm)': 0,
                    '5ft King (150 × 200 cm)': 60,
                    '6ft Super King (180 × 200 cm)': 120,
                },
                mattresses: {
                    'No Mattress (Frame Only)': 0,
                    Orthopaedic: 129,
                    'Super Orthopaedic': 159,
                    'Pocket Spring': 189,
                    'Roma Pillow Top': 219,
                    'Blue Wave Hybrid': 249,
                },
                liftOptions: {
                    'End Lift Ottoman': 0,
                    'Side Lift Ottoman': 20,
                },
                fabrics: {},
            },
            structuredDimensions: {
                default: {
                    length: '205 cm (6ft 9in)',
                    width: '148 cm (4ft 10in)',
                    depth: '137 cm (4ft 6in)',
                    custom: 'Internal Storage Depth: 28 cm (11in)',
                },
                bySize: {
                    '3ft Single (90 × 190 cm)': {
                        length: '205 cm (6ft 9in)',
                        width: '102 cm (3ft 4in)',
                        depth: '137 cm (4ft 6in)',
                        custom: 'Fits 3ft Single Mattress (90 × 190 cm)',
                    },
                    '4ft Small Double (120 × 190 cm)': {
                        length: '205 cm (6ft 9in)',
                        width: '132 cm (4ft 4in)',
                        depth: '137 cm (4ft 6in)',
                        custom: 'Fits 4ft Small Double Mattress (120 × 190 cm)',
                    },
                    '4ft 6in Double (135 × 190 cm)': {
                        length: '205 cm (6ft 9in)',
                        width: '148 cm (4ft 10in)',
                        depth: '137 cm (4ft 6in)',
                        custom: 'Fits 4ft 6in Double Mattress (135 × 190 cm)',
                    },
                    '5ft King (150 × 200 cm)': {
                        length: '215 cm (7ft 1in)',
                        width: '163 cm (5ft 4in)',
                        depth: '137 cm (4ft 6in)',
                        custom: 'Fits 5ft King Mattress (150 × 200 cm)',
                    },
                    '6ft Super King (180 × 200 cm)': {
                        length: '215 cm (7ft 1in)',
                        width: '193 cm (6ft 4in)',
                        depth: '137 cm (4ft 6in)',
                        custom: 'Fits 6ft Super King Mattress (180 × 200 cm)',
                    },
                },
            },
        },
    },
    {
        id: 'bellagio-marble-dining-table',
        name: 'Bellagio 180cm Sintered Marble Dining Table',
        price: 599.0,
        previousPrice: 749.0,
        description:
            'Featuring a heat, stain, and scratch-resistant sintered stone marble top set upon an architectural powder-coated pedestal base. Comfortably seats 6 to 8 guests.',
        category: 'Tables',
        subcategory: 'Dining Tables',
        badge: 'Luxury Stone Top',
        stock: 4,
        isPopular: true,
        isTrending: false,
        delivery: '3–10 days',
        colors: ['White Marble', 'Grey', 'Black'],
        image:
            'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1617806118233-18e1de247200?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: ['Length: 180 cm (5ft 11in) | Width: 90 cm (2ft 11in) | Depth: 76 cm (2ft 6in)'],
        features: [
            '12mm sintered stone marble surface',
            'Heat, stain, and scratch resistant',
            'Architectural powder-coated steel pedestal base',
        ],
        variations: {
            fabrics: [],
            sizes: [
                '5ft 3in / 160 cm (6 Seater)',
                '5ft 11in / 180 cm (6–8 Seater)',
                '6ft 7in / 200 cm (8 Seater)',
            ],
            mattresses: [],
            liftOptions: [],
            priceDeltas: {
                sizes: {
                    '5ft 3in / 160 cm (6 Seater)': -50,
                    '5ft 11in / 180 cm (6–8 Seater)': 0,
                    '6ft 7in / 200 cm (8 Seater)': 80,
                },
            },
            structuredDimensions: {
                default: {
                    length: '180 cm (5ft 11in)',
                    width: '90 cm (2ft 11in)',
                    depth: '76 cm (2ft 6in)',
                    custom: 'Comfortably seats 6 to 8 dining chairs',
                },
                bySize: {},
            },
        },
    },
    {
        id: 'mayfair-knocker-dining-chairs',
        name: 'Mayfair Velvet Knockerback Dining Chairs (Set of 2)',
        price: 229.0,
        previousPrice: null,
        description:
            'Button-tufted velvet dining chairs finished with chrome ring knockers, silver studding trim, and solid tapered legs.',
        category: 'Chairs',
        subcategory: 'Dining Chairs',
        badge: 'Pair (Set of 2)',
        stock: null,
        isPopular: true,
        isTrending: false,
        delivery: '2–5 days',
        colors: ['Grey', 'Black', 'Cream', 'Navy Blue'],
        image:
            'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: ['Length: 62 cm (2ft) | Width: 56 cm (1ft 10in) | Depth: 94 cm (3ft 1in)'],
        features: [
            'Polished chrome ring backrest knocker',
            'Deep button-tufted backrest with stud detailing',
            'High-density sprung seat pad',
        ],
        variations: {
            fabrics: ['Plush Velvet', 'Naples'],
            sizes: [],
            mattresses: [],
            liftOptions: [],
            priceDeltas: {},
            structuredDimensions: {
                default: {
                    length: '62 cm (2ft)',
                    width: '56 cm (1ft 10in)',
                    depth: '94 cm (3ft 1in)',
                    custom: 'Seat Height: 49 cm (19in)',
                },
                bySize: {},
            },
        },
    },
    {
        id: 'verona-mirrored-sliding-wardrobe',
        name: 'Verona Full-Mirror Sliding Door Wardrobe',
        price: 499.0,
        previousPrice: 599.0,
        description:
            'Maximise bedroom light and storage with full-length safety-backed mirrors, smooth German-engineered aluminium sliding tracks, internal hanging rails, and overhead shelving.',
        category: 'Wardrobes',
        subcategory: 'Sliding Wardrobes',
        badge: 'Space Saver',
        stock: 5,
        isPopular: false,
        isTrending: true,
        delivery: '3–10 days',
        colors: ['White', 'Grey', 'Black', 'Natural Oak'],
        image:
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: ['Length: 215 cm (7ft 1in) | Width: 180 cm (5ft 11in) | Depth: 62 cm (2ft)'],
        features: [
            'Smooth-glide aluminium track mechanism',
            'Multiple adjustable shelves and dual hanging rails',
            'High-density 16mm laminated board construction',
        ],
        variations: {
            fabrics: [],
            sizes: [
                '4ft 11in / 150 cm Wide',
                '5ft 11in / 180 cm Wide',
                '6ft 8in / 203 cm Wide',
            ],
            mattresses: [],
            liftOptions: [],
            priceDeltas: {
                sizes: {
                    '4ft 11in / 150 cm Wide': -40,
                    '5ft 11in / 180 cm Wide': 0,
                    '6ft 8in / 203 cm Wide': 60,
                },
            },
            structuredDimensions: {
                default: {
                    length: '215 cm (7ft 1in)',
                    width: '180 cm (5ft 11in)',
                    depth: '62 cm (2ft)',
                    custom: 'Includes 2 hanging rails and 5 storage shelves',
                },
                bySize: {
                    '4ft 11in / 150 cm Wide': {
                        length: '215 cm (7ft 1in)',
                        width: '150 cm (4ft 11in)',
                        depth: '62 cm (2ft)',
                        custom: '2 Sliding Doors | 150 cm (4ft 11in) Wide',
                    },
                    '5ft 11in / 180 cm Wide': {
                        length: '215 cm (7ft 1in)',
                        width: '180 cm (5ft 11in)',
                        depth: '62 cm (2ft)',
                        custom: '2 Sliding Doors | 180 cm (5ft 11in) Wide',
                    },
                    '6ft 8in / 203 cm Wide': {
                        length: '215 cm (7ft 1in)',
                        width: '203 cm (6ft 8in)',
                        depth: '62 cm (2ft)',
                        custom: '2 Large Sliding Doors | 203 cm (6ft 8in) Wide',
                    },
                },
            },
        },
    },
    {
        id: 'chatsworth-fluted-oak-sideboard',
        name: 'Chatsworth Fluted Oak & Brass Media Sideboard',
        price: 429.0,
        previousPrice: null,
        description:
            'Architectural fluted tambour doors paired with warm natural oak veneer and brushed brass hardware. Ideal as a dining room credenza or large living room media console.',
        category: 'Cabinets',
        subcategory: 'Sideboards',
        badge: 'New Arrival',
        stock: null,
        isPopular: false,
        isTrending: false,
        delivery: '3–7 days',
        colors: ['Natural Oak', 'Walnut', 'Black'],
        image:
            'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=85',
        images: [
            'https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1000&q=85',
        ],
        dimensions: ['Length: 160 cm (5ft 3in) | Width: 42 cm (1ft 5in) | Depth: 78 cm (2ft 7in)'],
        features: [
            'Soft-close fluted doors with internal cable management',
            'Brushed brass steel frame and handles',
            'Adjustable interior shelving',
        ],
        variations: {
            fabrics: [],
            sizes: [],
            mattresses: [],
            liftOptions: [],
            priceDeltas: {},
            structuredDimensions: {
                default: {
                    length: '160 cm (5ft 3in)',
                    width: '42 cm (1ft 5in)',
                    depth: '78 cm (2ft 7in)',
                    custom: 'Fits TVs up to 70 inches',
                },
                bySize: {},
            },
        },
    },
];

export const initialReviews = [
    {
        id: 'rev-1',
        author: 'Rebecca & Tom H.',
        location: 'Maltby, Rotherham',
        rating: 5,
        date: 'October 2026',
        productName: 'Luna U-Shape Modular Sofa Bed',
        comment:
            'Popped into the High Street showroom in Maltby to test the fabrics first. Delivered within 4 days and the lads set the whole U-shape sofa up in our living room. Quality is spot on.',
        images: [],
        verified: true,
        adminResponse:
            'Thank you so much Rebecca and Tom! Lovely meeting you both in our Maltby showroom—enjoy the new Luna sofa!',
    },
    {
        id: 'rev-2',
        author: 'Mohammed A.',
        location: 'Sheffield',
        rating: 5,
        date: 'October 2026',
        productName: 'Kensington Wingback Gas-Lift Ottoman Bed',
        comment:
            'Ordered the 5ft King in Plush Velvet Grey with the Orthopaedic mattress. The gas lift storage underneath holds all our spare suitcases and bedding easily.',
        images: [],
        verified: true,
        adminResponse: '',
    },
    {
        id: 'rev-3',
        author: 'Claire D.',
        location: 'Doncaster',
        rating: 5,
        date: 'September 2026',
        productName: 'Bellagio 180cm Sintered Marble Dining Table',
        comment:
            'Stunning marble dining table, heavy and solid. Communication from the showroom team regarding delivery time was brilliant.',
        images: [],
        verified: true,
        adminResponse: '',
    },
];