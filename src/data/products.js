export const SHOP_INFO = {
    name: 'SJ Home Interiors',
    tagline: 'Quality Furniture at Affordable Showroom Prices',
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
    // Core & Standard Colours
    Beige: '#B59B7C',
    Cream: '#E5DFD3',
    Ivory: '#EAE6D7',
    White: '#F2F2F0',
    'White Marble': '#F2F0EB',
    Grey: '#8C8C8C',
    'Light Grey': '#C4C4C4',
    Silver: '#9EA2A5',
    'Silver Grey': '#B2B5B8',
    'Slate Grey': '#3D4043',
    Steel: '#73767A',
    Charcoal: '#3E4042',
    Anthracite: '#292C2F',
    Black: '#1C1B18',
    Blue: '#2B547E',
    'Navy Blue': '#1B2A4A',
    'Royal Blue': '#1E3F8B',
    'Sky Blue': '#7BAFD4',
    Teal: '#1B5E68',
    Green: '#3B5249',
    'Sage Green': '#8A9A86',
    'Emerald Green': '#184A3B',
    Emrald: '#3B5E52',
    'Forest Green': '#233D2C',
    Olive: '#556B2F',
    Taupe: '#8B7D70',
    Mink: '#7A6855',
    Cappucino: '#9C8265',
    Champagne: '#E6D7C3',
    Brown: '#5C4033',
    Tan: '#B87333',
    Cognac: '#8F4B2D',
    Walnut: '#4B3621',
    'Natural Oak': '#C8A165',
    'Rustic Oak': '#9E7344',
    Gold: '#9C784C',
    'Brushed Brass': '#B59449',
    Chrome: '#8E9194',
    'Blush Pink': '#E3BCBC',
    Pink: '#B5747B',
    Mustard: '#D49B27',
    Tumeric: '#8C6226',
    Terracotta: '#B85D43',
    Plum: '#583149',
    // Wool Swatch Specifics
    Bronze: '#8C8272',
    Chestnut: '#4F3524',
    Jade: '#647C87',
    Latte: '#5E4633',
    Lilac: '#4A2C40',
    Marine: '#3E4E68',
    Mocha: '#4B3A2C',
    Pewter: '#595C60',
    Raven: '#332C27',
    Sapphire: '#232B59',
    Shadow: '#222426',
    Wheat: '#6C5035',
    // Spice Velvet Swatch Specifics
    Armour: '#87888A',
    Claret: '#7E4548',
    Petrol: '#556869',
    Storm: '#383B3E',
    Denim: '#223A60',
};

/**
 * Built-in Fabric Colour Infographics matching the uploaded swatch charts
 * (Wool, Spice Velvet, Naples, plus Plush Velvet, Teddy, Linoso, and Marble).
 * Admin can also attach custom image URLs/uploads in Site Settings -> customFabricImages.
 */
export const FABRIC_INFOGRAPHICS = {
    Wool: {
        title: 'Wool Fabric Colours',
        subtitle: 'Warm, textured woven wool upholstery — hard-wearing & cosy',
        textureStyle: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 0)',
        textureSize: '4px 4px',
        image: '/fabrics/wool-colours.jpg',
        swatches: [
            { name: 'Bronze', hex: '#8C8272', span: 1 },
            { name: 'Chestnut', hex: '#4F3524', span: 1 },
            { name: 'Chrome', hex: '#8E9194', span: 1 },
            { name: 'Gold', hex: '#9C784C', span: 1 },
            { name: 'Jade', hex: '#647C87', span: 1 },
            { name: 'Latte', hex: '#5E4633', span: 1 },
            { name: 'Lilac', hex: '#4A2C40', span: 1 },
            { name: 'Marine', hex: '#3E4E68', span: 1 },
            { name: 'Mocha', hex: '#4B3A2C', span: 1 },
            { name: 'Pewter', hex: '#595C60', span: 1 },
            { name: 'Raven', hex: '#332C27', span: 1 },
            { name: 'Sapphire', hex: '#232B59', span: 1 },
            { name: 'Shadow', hex: '#222426', span: 1.5 },
            { name: 'Steel', hex: '#6D7075', span: 1.5 },
            { name: 'Teal', hex: '#1B5E68', span: 1.5 },
            { name: 'Wheat', hex: '#6C5035', span: 1.5 },
        ],
    },
    'Spice Velvet': {
        title: 'Spice Velvet Fabric Colours',
        subtitle: 'Rich, mottled velvet with a soft sheen and easy-clean finish',
        textureStyle: 'linear-gradient(135deg, rgba(255,255,255,0.14) 0%, rgba(0,0,0,0.12) 100%)',
        textureSize: '100% 100%',
        image: '/fabrics/spice-velvet-colours.jpg',
        swatches: [
            { name: 'Armour', hex: '#87888A', span: 1 },
            { name: 'Beige', hex: '#9B8064', span: 1 },
            { name: 'Claret', hex: '#7E4548', span: 1 },
            { name: 'Emrald', hex: '#3B5E52', span: 1 },
            { name: 'Ivory', hex: '#DFDBC9', textDark: true, span: 1 },
            { name: 'Petrol', hex: '#556869', span: 1 },
            { name: 'Storm', hex: '#383B3E', span: 1 },
            { name: 'Tumeric', hex: '#8C6226', span: 1 },
            { name: 'Denim', hex: '#223A60', span: 1 },
            { name: 'Pink', hex: '#B5747B', span: 3 },
        ],
    },
    Naples: {
        title: 'Naples Fabric Colours',
        subtitle: 'Fine ribbed cord-velvet texture — soft to the touch & family friendly',
        textureStyle: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.09) 0px, rgba(255,255,255,0.09) 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)',
        textureSize: '100% 6px',
        image: '/fabrics/naples-colours.jpg',
        swatches: [
            { name: 'Beige', hex: '#AC9375', span: 1 },
            { name: 'Black', hex: '#1E1F21', span: 1 },
            { name: 'Cappucino', hex: '#91785B', span: 1 },
            { name: 'Cream', hex: '#DDD6C6', textDark: true, span: 1 },
            { name: 'Mink', hex: '#776654', span: 1 },
            { name: 'Silver', hex: '#96989B', span: 1 },
            { name: 'Slate Grey', hex: '#35383B', span: 1 },
            { name: 'Steel', hex: '#737678', span: 1 },
            { name: 'White', hex: '#EAEAE8', textDark: true, span: 1 },
        ],
    },
    'Plush Velvet': {
        title: 'Plush Velvet Fabric Colours',
        subtitle: 'Smooth, dense pile velvet with a classic smooth finish',
        textureStyle: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.08) 100%)',
        textureSize: '100% 100%',
        swatches: [
            { name: 'Cream', hex: '#E8E2D5', textDark: true, span: 1 },
            { name: 'Beige', hex: '#C8B9A6', span: 1 },
            { name: 'Mink', hex: '#9E8E7E', span: 1 },
            { name: 'Silver', hex: '#B4B7BA', span: 1 },
            { name: 'Steel', hex: '#6C7075', span: 1 },
            { name: 'Charcoal', hex: '#3B3E42', span: 1 },
            { name: 'Black', hex: '#1A1A1A', span: 1 },
            { name: 'Navy Blue', hex: '#1B2A4A', span: 1 },
            { name: 'Emerald Green', hex: '#184A3B', span: 1 },
            { name: 'Blush Pink', hex: '#DAB6B6', textDark: true, span: 1.5 },
            { name: 'Mustard', hex: '#C99326', span: 1.5 },
        ],
    },
    Teddy: {
        title: 'Teddy Bouclé Fabric Colours',
        subtitle: 'Cosy, looped fleecy bouclé texture for extra warmth and comfort',
        textureStyle: 'radial-gradient(rgba(0,0,0,0.14) 1.5px, transparent 0)',
        textureSize: '6px 6px',
        swatches: [
            { name: 'Ivory', hex: '#EFECE4', textDark: true, span: 1 },
            { name: 'Cream', hex: '#E2DACB', textDark: true, span: 1 },
            { name: 'Beige', hex: '#C2B099', span: 1 },
            { name: 'Taupe', hex: '#8B7D70', span: 1 },
            { name: 'Grey', hex: '#8A8D91', span: 1 },
            { name: 'Charcoal', hex: '#3E4042', span: 1 },
        ],
    },
    Linoso: {
        title: 'Linoso Linen-Weave Colours',
        subtitle: 'Breathable, natural-look basketweave linen upholstery',
        textureStyle: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 4px)',
        textureSize: '8px 8px',
        swatches: [
            { name: 'Cream', hex: '#E5DFD2', textDark: true, span: 1 },
            { name: 'Beige', hex: '#C7B8A1', span: 1 },
            { name: 'Light Grey', hex: '#B8BABC', span: 1 },
            { name: 'Grey', hex: '#828588', span: 1 },
            { name: 'Charcoal', hex: '#404347', span: 1 },
            { name: 'Green', hex: '#43594E', span: 1 },
        ],
    },
    Marble: {
        title: 'Marble Patterned Velvet Colours',
        subtitle: 'Statement veined marble-effect velvet upholstery',
        textureStyle: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 50%, rgba(0,0,0,0.15) 100%)',
        textureSize: '100% 100%',
        swatches: [
            { name: 'White Marble', hex: '#EAE8E3', textDark: true, span: 1 },
            { name: 'Silver', hex: '#A4A7AB', span: 1 },
            { name: 'Grey', hex: '#75787C', span: 1 },
            { name: 'Charcoal', hex: '#393C40', span: 1 },
            { name: 'Beige', hex: '#BDA98E', span: 1 },
            { name: 'Black', hex: '#1F2022', span: 1 },
        ],
    },
};

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
    { id: 'Popular', label: '★ Best Value' },
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
            'Unbeatable value for generous family living. Built with a solid hardwood frame, high-density foam cushions, two hidden under-chaise storage compartments, and a pull-out guest sleeper.',
        category: 'Sofas',
        subcategory: 'U-Shape Sofas',
        badge: 'Great Value',
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
            fabrics: ['Linoso', 'Plush Velvet', 'Naples', 'Teddy', 'Wool', 'Spice Velvet'],
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
            'Direct showroom value on a solid UK-built ottoman bed. Features a deep fluted wingback headboard and heavy-duty gas-lift storage base. Click any fabric option to view its full colour chart.',
        category: 'Beds',
        subcategory: 'Ottoman Beds',
        badge: 'Best Seller',
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
                'Spice Velvet',
                'Wool',
                'Linoso',
                'Teddy',
                'Marble',
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
            'High-end dining quality without the designer price tag. Heat, stain, and scratch-resistant sintered stone top on a sturdy powder-coated steel pedestal base.',
        category: 'Tables',
        subcategory: 'Dining Tables',
        badge: 'Showroom Value',
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
            'Heavy-duty powder-coated steel pedestal base',
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
            'Affordable everyday quality. Deep button-tufted velvet dining chairs finished with polished chrome ring knockers, silver stud trim, and solid wooden legs.',
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
            fabrics: ['Plush Velvet', 'Naples', 'Spice Velvet', 'Wool'],
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
            'Built to last at an affordable showroom price. Full-length safety-backed mirrors, smooth aluminium sliding tracks, dual hanging rails, and deep overhead storage shelves.',
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
            'Sturdy, stylish storage at a fair price. Fluted tambour doors paired with warm natural oak veneer and brushed brass hardware.',
        category: 'Cabinets',
        subcategory: 'Sideboards',
        badge: 'Direct Price',
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
            'Popped into the High Street showroom in Maltby to test the fabrics first. Saved ratusan compared to the big retail parks and the quality is genuinely spot on.',
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
            'Ordered the 5ft King with the Orthopaedic mattress. Brilliant price for a solid bed and the gas-lift storage underneath holds all our spare suitcases easily.',
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
            'Heavy, solid marble dining table at half the price we saw elsewhere. Communication from the showroom team regarding delivery time was brilliant.',
        images: [],
        verified: true,
        adminResponse: '',
    },
];