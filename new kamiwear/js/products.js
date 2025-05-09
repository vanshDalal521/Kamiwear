// products.js
const products = [
    {
        id: 'ds-tshirt-1',
        name: 'Demon Slayer Tanjiro T-Shirt',
        price: 29.99,
        oldPrice: 39.99,
        description: 'High-quality cotton t-shirt featuring Tanjiro Kamado from Demon Slayer. Perfect for anime fans and casual wear.',
        images: [
            '/assets/t-shirts/ds-tshirt-1-1.jpg',
            '/assets/t-shirts/ds-tshirt-1-2.jpg',
            '/assets/t-shirts/ds-tshirt-1-3.jpg'
        ],
        colors: ['#000000', '#FFFFFF', '#FF0000'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        rating: 4.8,
        reviews: [
            {
                name: 'John Doe',
                avatar: '/assets/avatars/user1.jpg',
                rating: 5,
                text: 'Amazing quality and design! The fabric is super comfortable.'
            },
            {
                name: 'Jane Smith',
                avatar: '/assets/avatars/user2.jpg',
                rating: 4.5,
                text: 'Great t-shirt, but the sizing runs a bit small.'
            }
        ],
        category: 't-shirts',
        collection: 'demon-slayer',
        tags: ['anime', 'demon-slayer', 'tanjiro', 't-shirt']
    },
    {
        id: 'ds-hoodie-1',
        name: 'Demon Slayer Nezuko Hoodie',
        price: 49.99,
        oldPrice: 59.99,
        description: 'Premium quality hoodie featuring Nezuko Kamado from Demon Slayer. Perfect for cold weather and casual style.',
        images: [
            '/assets/hoodies/ds-hoodie-1-1.jpg',
            '/assets/hoodies/ds-hoodie-1-2.jpg',
            '/assets/hoodies/ds-hoodie-1-3.jpg'
        ],
        colors: ['#000000', '#FFFFFF', '#FF0000'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        rating: 4.9,
        reviews: [
            {
                name: 'Mike Johnson',
                avatar: '/assets/avatars/user3.jpg',
                rating: 5,
                text: 'Best hoodie ever! The design is perfect and the material is so comfortable.'
            },
            {
                name: 'Sarah Wilson',
                avatar: '/assets/avatars/user4.jpg',
                rating: 4.8,
                text: 'Love the design and quality. Perfect for winter!'
            }
        ],
        category: 'hoodies',
        collection: 'demon-slayer',
        tags: ['anime', 'demon-slayer', 'nezuko', 'hoodie']
    },
    {
        id: 'jk-tshirt-1',
        name: 'Jujutsu Kaisen Yuji T-Shirt',
        price: 29.99,
        oldPrice: 39.99,
        description: 'Stylish t-shirt featuring Yuji Itadori from Jujutsu Kaisen. Made with premium cotton for maximum comfort.',
        images: [
            '/assets/t-shirts/jk-tshirt-1-1.jpg',
            '/assets/t-shirts/jk-tshirt-1-2.jpg',
            '/assets/t-shirts/jk-tshirt-1-3.jpg'
        ],
        colors: ['#000000', '#FFFFFF', '#FF0000'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        rating: 4.7,
        reviews: [
            {
                name: 'Alex Brown',
                avatar: '/assets/avatars/user5.jpg',
                rating: 4.5,
                text: 'Great quality and design. The print is very detailed.'
            },
            {
                name: 'Emily Davis',
                avatar: '/assets/avatars/user6.jpg',
                rating: 5,
                text: 'Perfect fit and amazing design. Will definitely buy more!'
            }
        ],
        category: 't-shirts',
        collection: 'jujutsu-kaisen',
        tags: ['anime', 'jujutsu-kaisen', 'yuji', 't-shirt']
    },
    {
        id: 'op-tshirt-1',
        name: 'One Piece Luffy T-Shirt',
        price: 29.99,
        oldPrice: 39.99,
        description: 'Classic t-shirt featuring Monkey D. Luffy from One Piece. Made with high-quality materials for everyday wear.',
        images: [
            '/assets/t-shirts/op-tshirt-1-1.jpg',
            '/assets/t-shirts/op-tshirt-1-2.jpg',
            '/assets/t-shirts/op-tshirt-1-3.jpg'
        ],
        colors: ['#000000', '#FFFFFF', '#FF0000'],
        sizes: ['S', 'M', 'L', 'XL', 'XXL'],
        rating: 4.6,
        reviews: [
            {
                name: 'David Miller',
                avatar: '/assets/avatars/user7.jpg',
                rating: 4.8,
                text: 'Awesome design and great quality. The fabric is very comfortable.'
            },
            {
                name: 'Lisa Anderson',
                avatar: '/assets/avatars/user8.jpg',
                rating: 4.4,
                text: 'Love the design! The t-shirt is perfect for casual wear.'
            }
        ],
        category: 't-shirts',
        collection: 'one-piece',
        tags: ['anime', 'one-piece', 'luffy', 't-shirt']
    },
    {
        id: 'ds-accessory-1',
        name: 'Demon Slayer Keychain Set',
        price: 19.99,
        oldPrice: 24.99,
        description: 'Set of 5 keychains featuring characters from Demon Slayer. Perfect for anime fans and collectors.',
        images: [
            '/assets/Accessories/ds-accessory-1-1.jpg',
            '/assets/Accessories/ds-accessory-1-2.jpg',
            '/assets/Accessories/ds-accessory-1-3.jpg'
        ],
        colors: ['#000000', '#FFFFFF'],
        sizes: ['One Size'],
        rating: 4.9,
        reviews: [
            {
                name: 'Tom Wilson',
                avatar: '/assets/avatars/user9.jpg',
                rating: 5,
                text: 'Amazing quality and detail! The keychains are so cute.'
            },
            {
                name: 'Rachel Green',
                avatar: '/assets/avatars/user10.jpg',
                rating: 4.7,
                text: 'Great set of keychains. The designs are perfect!'
            }
        ],
        category: 'accessories',
        collection: 'demon-slayer',
        tags: ['anime', 'demon-slayer', 'keychain', 'accessory']
    }
];

// Export products data
export default products;