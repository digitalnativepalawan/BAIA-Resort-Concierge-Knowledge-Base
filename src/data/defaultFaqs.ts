export interface FaqItem {
  id: string;
  question: string;
  keywords: string;
  answer: string;
  enabled: boolean;
  category?: string;
  updatedAt?: string;
}

export const INITIAL_GUEST_FAQS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Do you have vegetarian options?',
    keywords: 'vegetarian, vegan, plant-based, food, dietary, daily specials',
    answer: 'Yes — ask reception for the daily vegetarian specials.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-2',
    question: 'How do I get an exact package total?',
    keywords: 'quote, price, package, total, booking, cost, check-in, check-out, van',
    answer: 'Provide your exact check-in date, check-out date, number of guests, preferred room, and whether you need the airport van. BAIA management will prepare the final quote.',
    enabled: true,
    category: 'Check-in & Checkout'
  },
  {
    id: 'faq-3',
    question: 'How do I request towels, cleaning or room assistance?',
    keywords: 'towels, housekeeping, cleaning, room service, assistance, guest portal, message reception',
    answer: "Use Request Service or Message Reception in the Guest Portal. The request is sent into BAIA's guest request workflow for staff follow-up.",
    enabled: true,
    category: 'Housekeeping'
  },
  {
    id: 'faq-4',
    question: 'How many barangays does San Vicente have?',
    keywords: 'barangay, barangays, count, 10 barangays, local area, san vicente',
    answer: 'San Vicente has 10 barangays: Port Barton, Poblacion, Alimanguan, Caruray, New Agutaya, Santo Niño, New Canipo, Binga, Kemdeng, and San Isidro.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-5',
    question: 'How long does it take to get to San Vicente from Puerto Princesa?',
    keywords: 'puerto princesa, travel time, van, cherry bus, itabiak junction, duration',
    answer: 'By van: around 3 to 4 hours via shared or private van from the San Jose Bus Terminal or directly from Puerto Princesa International Airport. By bus: roughly 4 to 5 hours on a public bus (e.g. Cherry Bus). If taking an El Nido-bound bus, ask the driver to drop you at the Itabiak Junction, where you can catch a connecting local van or tricycle into San Vicente town proper.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-6',
    question: 'Where can I find completely uncrowded, raw beaches away from Long Beach?',
    keywords: 'uncrowded beaches, raw beaches, lumambong, mt capoas, erawan, nagtulay, boayan island',
    answer: "For absolute isolation, head north toward Mt. Capoas or explore the hidden coves between the main hubs. Lumambong Beach (Barangay Binga) is a 1.2-km stretch of pristine sand in Imuaran Bay at the foot of Mt. Capoas, with cool mountain breezes, calm waters great for swimming, kayaking, or paddleboarding, and no crowds. Erawan Beach and Nagtulay Beach (north of Alimanguan) are rugged fishing beaches lined with coconut palms where you'll rarely see another tourist. Boayan Island — the largest island in the municipality — is mostly uninhabited, with rocky coastlines, hidden coves, and coral drop-offs few day tours visit.",
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-7',
    question: 'Where can I stay in Alimanguan (northern Long Beach)?',
    keywords: 'alimanguan, stay, lazuli resort, tabularasa, victoria beach house, solmar beach camp, northern long beach',
    answer: 'Alimanguan (northern end of Long Beach) is known for local culture, wide sandy shores, surfing in monsoon season, and sunsets. Options: Lazuli Resort — premier beachfront boutique hotel with modern tropical design, pool, and upscale rooms on the sand; Tabularasa - T Palawan — intimate beachside hideaway with cozy interiors, outdoor pool, and local seafood; Victoria Beach House — classic beachfront property with rustic comfort and sunset views; Solmar Beach Camp — beachfront glamping/camping for budget travelers and nature lovers.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-8',
    question: 'What time do island tours leave?',
    keywords: 'tour time, island hopping, departure, 8 am, morning, schedule',
    answer: 'Island tours typically depart at 8:00 AM. Confirm with reception the day before.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-9',
    question: 'What time is check-in?',
    keywords: 'check in, checkin, arrival time, hours, 2 pm, late arrival',
    answer: 'Check-in is from 2:00 PM to 9:00 PM. Guests arriving after 6:00 PM must contact BAIA in advance.',
    enabled: true,
    category: 'Check-in & Checkout'
  },
  {
    id: 'faq-10',
    question: 'Can the concierge complete a service request by itself?',
    keywords: 'concierge, automated, complete, service request, action, reception',
    answer: 'No. The concierge can explain the process and help identify the correct request type, but staff action must go through Request Service or Reception.',
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-11',
    question: 'What is the population of San Vicente?',
    keywords: 'population, residents, census 2020, 2024 estimate, demographics',
    answer: 'Around 33,768 people (2024 estimate), up from 33,507 recorded in the 2020 census.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-12',
    question: 'How long does it take to get to San Vicente from El Nido?',
    keywords: 'el nido, travel time, direct van, motorbike scooter, distance',
    answer: 'By van: direct vans take about 2 to 3 hours. By motorbike (rental scooter via the highway): about 3 hours of scenic travel.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-13',
    question: 'Can you break down the different sections of the 14.7km Long Beach?',
    keywords: 'long beach sections, long beach 1, long beach 2, long beach 3, pinagmangalokan, enarayan, alimanguan',
    answer: 'Long Beach transitions through different vibes across its stretch: Long Beach 1 (Pinagmangalokan Beach, Brgy. New Agutaya) is the closest end to the town center and airport, with a wider shoreline and the first boutique eco-lodges. Long Beach 2 (Enarayan Beach, Brgy. San Isidro) is the peaceful, undeveloped middle section of endless coconut groves, perfect for solitary walks. Long Beach 3 (Alimanguan Beach) is the northern end, bordering a lively fishing village with local carinderias and fantastic open-ocean sunset views.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-14',
    question: 'Where can I stay in San Isidro (middle Long Beach)?',
    keywords: 'san isidro, middle long beach, hotel, resort, club agutaya, hotel elizabeth',
    answer: 'San Isidro is the peaceful, undeveloped middle section of Long Beach with coconut plantations and solitary coastline. Options: Club Agutaya — sprawling eco-luxury resort with Filipino-inspired premium villas, a large central pool, and sustainability focus; The Hotel Elizabeth Resort and Villas — upscale beachfront resort with private villas, gardens, and premium amenities.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-15',
    question: 'How do I request extra towels?',
    keywords: 'extra towels, linen, towels, room request, guest portal, reception',
    answer: 'Use Request Service in the guest portal, or message Reception.',
    enabled: true,
    category: 'Housekeeping'
  },
  {
    id: 'faq-16',
    question: 'What time is check-out?',
    keywords: 'checkout, check out, departure time, 12 noon, hours',
    answer: 'Check-out is from 7:00 AM to 12:00 noon.',
    enabled: true,
    category: 'Check-in & Checkout'
  },
  {
    id: 'faq-17',
    question: 'Can the concierge confirm a new booking or change my booking?',
    keywords: 'booking change, confirm booking, extension, cancellation, read-only, reception',
    answer: 'No. The concierge is read-only. For a new booking, extension, cancellation, room change or payment question, contact Reception.',
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-18',
    question: 'Which barangay is the most populated?',
    keywords: 'most populated barangay, port barton population, poblacion population',
    answer: 'Port Barton is the most populous barangay at 6,621 residents (2020), followed by Poblacion at 6,330.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-19',
    question: 'How long does it take to get between Port Barton and San Vicente town proper (Poblacion)?',
    keywords: 'port barton to poblacion, travel time, boat, bangka, motorbike',
    answer: 'By land: about 45 minutes to 1 hour via motorbike or local vehicle. By boat: a motorized bangka takes about 45 minutes to 1 hour depending on sea conditions.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-20',
    question: 'Are there any waterfalls near San Vicente or Port Barton?',
    keywords: 'waterfalls, pamuayan falls, bigaho falls, nature, jungle trek, port barton',
    answer: 'Yes — two freshwater escapes: Pamuayan Falls (Port Barton) sits in the jungle with a deep natural swimming pool; reach it via a moderate 1-hour jungle trek from the main road or as a stop on certain boat tours. Bigaho Falls (Port Barton) is highly accessible near a local village, with a multi-tiered drop and a man-made stone pathway — an easy walk for all fitness levels.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-21',
    question: 'Where can I stay in New Agutaya (southern Long Beach, near airport)?',
    keywords: 'new agutaya, airport resort, baibai long beach, jurisu resort, babaland, la vida bonita, beatus residence',
    answer: 'New Agutaya is the most accessible stretch of Long Beach, near San Vicente Airport and the town proper. Options: BAIBAI Long Beach — tranquil beachfront property with minimalist private rooms, gardens, and a private beach zone; JuRiSu Resort — mid-range family-friendly hotel with A/C rooms; Babaland — family guesthouse with garden, playground, and shared kitchen; La Vida Bonita — B&B praised for warm hospitality and breakfast; Beatus Residence — traditional Filipino-style rental a short walk from the shoreline.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-22',
    question: 'How much is the private airport van?',
    keywords: 'airport van price, private van, transfer cost, fee, P6000, 12 passengers',
    answer: 'The private van is P6,000 one way per vehicle for up to 12 passengers and must be requested at least 48 hours in advance with complete flight details.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-23',
    question: 'What booking information can the guest concierge use?',
    keywords: 'booking context, guest privacy, guest portal info, active booking',
    answer: "Only the authenticated guest's active booking context, including the guest name, room and checkout date supplied by the Guest Portal.",
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-24',
    question: 'How large is San Vicente?',
    keywords: 'land area, size, square kilometers, 1462 sq km, largest municipality palawan',
    answer: 'About 1,462.94 square kilometers — making San Vicente the largest municipality in Palawan by land area.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-25',
    question: 'Can I fly directly to San Vicente?',
    keywords: 'flights, san vicente airport, swo, direct flight, manila, clark',
    answer: 'Yes. San Vicente has its own airport (code SWO), and commercial flights occasionally operate from Manila or Clark. Alternatively, fly into Puerto Princesa (PPS) or El Nido (ENI) and take a land transfer.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-26',
    question: 'What is the Inandeng River Mangrove Tour?',
    keywords: 'inandeng river, mangrove tour, kayaking, birdwatching, eco tour',
    answer: "The Inandeng River, near the Long Beach area, offers a peaceful kayaking or small-boat eco-tour through a dense protected mangrove forest. It's a prime spot for birdwatching, spotting wildlife, and seeing the coastal ecosystems that keep Palawan's waters pristine.",
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-27',
    question: 'Where can I stay in Poblacion (town proper)?',
    keywords: 'poblacion, town proper, marina 4rooms, picardal lodge, nativo d kubo, ferranco, la acuario',
    answer: "Poblacion is the transit hub, commercial center, and municipal port where island-hopping boats depart. Options: Marina 4Rooms — nautical-themed boutique guesthouse with a rooftop deck over the marina; Picardal Lodge — affordable, clean no-frills rooms for backpackers and corporate travelers; NATIVO D' KUBO — cozy native nipa-hut rooms in a garden with a great onsite restaurant; Ferranco Tourist Inn — budget inn with clean rooms and parking; La Acuario Beach Inn — budget nipa-hut cottages on a quiet beachfront at Sitio Panindigan.",
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-28',
    question: 'What time is breakfast?',
    keywords: 'breakfast time, morning meals, breakfast hours, 8:30 am to 10:30 am',
    answer: 'Breakfast is served daily from 8:30 AM to 10:30 AM.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-29',
    question: 'Can the concierge show information about other guests or staff?',
    keywords: 'other guests, privacy, guest data, staff records, admin info',
    answer: "No. It must never reveal another guest's booking, room, requests, personal details, staff records or admin information.",
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-30',
    question: 'What region and province is San Vicente in?',
    keywords: 'region, province, mimaropa, region iv-b, palawan',
    answer: 'San Vicente is in the province of Palawan, within MIMAROPA (Region IV-B).',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-31',
    question: 'What is Long Beach and how long is it?',
    keywords: 'long beach length, 14.7km, 9.1 miles, longest white sand beach, description',
    answer: "Long Beach is San Vicente's crown jewel — a massive, undeveloped 14.7-kilometer (9.1 miles) continuous stretch of cream-colored sand, officially recognized as the longest white-sand beach in the Philippines. It covers multiple barangays including New Agutaya, San Isidro, and Alimanguan.",
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-32',
    question: 'What are the road conditions like if I want to explore Northern San Vicente (like Binga)?',
    keywords: 'road conditions, binga, highway, driving, scooter, gas stations',
    answer: 'The main Puerto Princesa–El Nido highway is fully paved and excellent, and the roads to San Vicente town proper and Alimanguan are smooth. Driving further north to remote spots like Binga, the coastal roads have been upgraded recently — now a smooth, scenic 45-minute drive from San Vicente Airport. If renting a scooter, drive carefully on coastal dirt turn-offs, keep a full tank (gas stations are scarce outside main towns), and avoid remote routes after dark due to limited lighting.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-33',
    question: 'Where can I stay in Port Barton?',
    keywords: 'port barton, hostels, parrots resort, summer homes, holiday suites, ausan, jungle bar',
    answer: 'Port Barton is a laid-back backpacker village about an hour south of town. Options: Parrots Boutique Resort — boutique hotel with garden and pool; Summer Homes Beach Front Resort — beachfront native cottages with massage; Holiday Suites Port Barton — modern hotel with A/C rooms and pool; Ausan Beach Front Cottages — beachfront native cottages with dining; Hotel Oasis Port Barton — value option with shared pool; Jungle Bar Resto & Cottages — rustic off-grid treehouse huts in the hillside jungle; My Green Hostel / Garpeza Backpackers — social hostels with dorms and private rooms.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-34',
    question: 'How much is breakfast?',
    keywords: 'breakfast price, cost, P400 adult, P400 child',
    answer: 'When breakfast is not included in the room package, cooked-to-order breakfast is approximately P400 per adult and P400 per child.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-35',
    question: 'Where does the concierge get menu and price information?',
    keywords: 'menu source, prices, live baia menu, reception',
    answer: 'From the live BAIA menu in the system. If an item, price or availability is not present in live data, ask Reception instead of guessing.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-36',
    question: 'What is the zip code of San Vicente?',
    keywords: 'zip code, postal code, 5309, san vicente zip',
    answer: 'The zip code for San Vicente, Palawan is 5309.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-37',
    question: 'What is the 100 Steps viewpoint?',
    keywords: '100 steps viewpoint, sanvic viewpoint, panoramic view, sunset spot, environmental fee',
    answer: 'The 100 Steps Viewpoint (also called the SanVic Viewpoint) is a hilltop panoramic deck just minutes outside the Poblacion town center. Visitors pay a small environmental fee (around ₱20–₱25) to head up. It feels like a bit more than 100 steps to the peak, but rewards you with a 360-degree view of the South China Sea, the coastline, and surrounding islands — one of the best sunset spots in town.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-38',
    question: 'Is there reliable electricity and internet in San Vicente?',
    keywords: 'electricity, internet, starlink, solar power, globe smart, brownouts',
    answer: 'In the town proper and Port Barton, standard grid electricity is available (brief rotational brownouts can occur) and mobile data (Globe and Smart) is generally good in town centers. In remote barangays like Binga or Caruray, areas are off-the-grid — eco-resorts there run on 100% solar power, and while top properties use satellite internet (Starlink) to stay connected, cell service can be spotty on the raw beaches.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-39',
    question: 'Where can I stay in Binga and the remote northern points?',
    keywords: 'binga, binga beach cabins, amuma, prince john eco bungalows, sunset colors, Lumambong',
    answer: 'Binga and the remote north are off-the-grid, raw areas at the foot of Mt. Capoas for wild nature. Options: Binga Beach Cabins and upcoming AMUMA — boutique eco-resorts on Lumambong Beach with premium glamping and cabins running on 100% solar power and Starlink; Prince John Beachfront Eco Bungalows (Sitio Nao Nao) — rustic off-grid bungalows focused on nature and isolation; Sunset Colors (Sitio Nao Nao) — quiet eco-resort in a remote cove famous for sunsets.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-40',
    question: 'How fast is the Wi-Fi?',
    keywords: 'wifi speed, internet speed, 50 mbps fiber, cellular hotspots',
    answer: 'BAIA targets 50+ Mbps over fiber where stable. Local outages and connection drops can occur, with Smart and Globe cellular hotspots used as backups.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-41',
    question: 'How do I ask about or book a tour?',
    keywords: 'book tour, tour booking, island hopping request, live tour list, reception',
    answer: 'The concierge can explain tours shown in the live BAIA tour list. To reserve or confirm a tour, contact Reception or use the available guest request flow.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-42',
    question: 'Is San Vicente coastal?',
    keywords: 'coastal, south china sea, geography, location',
    answer: 'Yes. San Vicente is a coastal municipality fronting the South China Sea.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-43',
    question: 'What is Bato ni Ningning?',
    keywords: 'bato ni ningning, viewpoint, long beach view, rocky outlook',
    answer: "Bato ni Ningning is a famous elevated rocky viewpoint along the coast that offers sweeping views of the curve of Long Beach. It's a popular stop on local tricycle and motorbike land tours.",
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-44',
    question: 'Can you surf in San Vicente?',
    keywords: 'surfing, waves, amihan season, alimanguan beach, erawan beach',
    answer: 'Yes. While the dry summer brings calm, glass-like waters, during the Amihan (Northeast Monsoon) season from November to March the waves pick up significantly at the northern end of Long Beach (Alimanguan) and Erawan Beach, making them fantastic uncrowded surf spots for local surfers and adventurous beginners.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-45',
    question: 'Does BAIA have backup power?',
    keywords: 'backup generator, paleco grid, power outage, load management, air conditioning',
    answer: 'BAIA is connected to the PALECO main grid and has local backup generation. During total grid failures, continuous air conditioning across multiple units may be limited by generator load management.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-46',
    question: 'How do I arrange transport?',
    keywords: 'arrange transport, airport shuttle, tricycle rental, van, reception',
    answer: 'The concierge can explain transport options and rates shown in the live BAIA system. Actual availability, pickup time and confirmation must come from Reception.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-47',
    question: 'Which barangays make up the Long Beach area?',
    keywords: 'long beach barangays, alimanguan, kemdeng, new agutaya, poblacion, san isidro',
    answer: 'The Long Beach Area includes five barangays: Alimanguan, Kemdeng, New Agutaya, Poblacion, and San Isidro.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-48',
    question: 'What are the main island hopping tours in San Vicente and Port Barton?',
    keywords: 'island hopping, inaladelan, german island, sea turtles, exotic island, maxima island, starfish island, twin reef, fantastic reef',
    answer: 'Tours are generally split between the San Vicente Poblacion circuit and the Port Barton circuit. Key highlights: Inaladelan Island (formerly German Island) — a private island famous for shallow coral gardens where you can swim with wild sea turtles; Exotic Island & Maxima Island — two islands separated by a shallow turquoise channel you can wade through at low tide; Starfish Island / Sandbar — a shifting white sandbar with hundreds of starfish; Twin Reef & Fantastic Reef — top marine sanctuaries for snorkeling with massive coral and schools of fish.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-49',
    question: 'How do I rent an item or vehicle?',
    keywords: 'rent vehicle, scooter rental, kayak rental, equipment, reception',
    answer: 'The concierge can explain rentals listed in the live BAIA system. Availability and final confirmation must be handled by Reception.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-50',
    question: 'Which areas are the main tourism zones in San Vicente?',
    keywords: 'tourism zones, port barton zone, long beach cluster',
    answer: 'Port Barton is designated the main Tourism Zone. Long Beach — spanning five barangays — is the other key tourism cluster.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-51',
    question: 'What are the 10 barangays of San Vicente?',
    keywords: '10 barangays, list of barangays, poblacion, new agutaya, san isidro, alimanguan, port barton, binga, caruray, kemdeng, new canipo, santo nino',
    answer: 'San Vicente is divided into 10 barangays: Poblacion (town center and main boat pier); New Agutaya (initial stretch of Long Beach); San Isidro (middle stretch of Long Beach); Alimanguan (northern end of Long Beach, known for sunsets); Port Barton (laid-back coastal village); Binga (north, near Mt. Capoas, quiet beaches like Lumambong); Caruray (rustic remote coastal barangay south of Port Barton); Kemdeng (known for hot springs and mangrove eco-trails); New Canipo (agricultural and fishing village north of Long Beach); and Santo Niño (rural interior/coastal area with hidden coves).',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-52',
    question: 'What should I do in an emergency or urgent safety situation?',
    keywords: 'emergency, safety, urgent, medical, contact reception immediately',
    answer: 'Contact Reception or on-site staff immediately. The concierge must not delay urgent help by trying to troubleshoot a safety or medical emergency.',
    enabled: true,
    category: 'Emergency Information'
  },
  {
    id: 'faq-53',
    question: 'Which barangays are growing the fastest?',
    keywords: 'fastest growing barangay, population growth, new agutaya, santo nino',
    answer: 'Between 2015 and 2020, New Agutaya grew fastest at +29.26%, followed by Santo Niño at +21.74%.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-54',
    question: 'Are there ATMs in San Vicente?',
    keywords: 'atms, cash, money, bank terminals, withdraw php, local currency',
    answer: 'Cash is king here. A couple of local bank terminals near the town center exist, but they frequently run out of cash or lose connection. It is highly recommended to withdraw enough Philippine Pesos (PHP) in Puerto Princesa or El Nido before traveling down.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-55',
    question: 'Can the concierge recommend places around San Vicente?',
    keywords: 'recommendations, concierge advice, local suggestions, approved knowledge',
    answer: 'Yes, using approved BAIA knowledge. It must clearly separate verified resort information from general suggestions and must not invent opening hours, travel times, prices or availability.',
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-56',
    question: "What is San Vicente's income class and revenue?",
    keywords: 'income class, 1st class municipality, revenue, 2024 revenue, economy',
    answer: 'San Vicente is a 1st class municipality, with 2024 revenue of about ₱551.4 million.',
    enabled: true,
    category: 'Local Area'
  },
  {
    id: 'faq-57',
    question: 'How do tourists get around locally?',
    keywords: 'local transport, e-trikes, electric tricycles, scooter rental, motorbike, 500 php',
    answer: 'The most common options are hiring local E-Trikes (electric tricycles) for short inner-town hops, or renting a self-drive scooter/motorbike (usually around ₱500 per day) for freedom to explore the remote beaches and viewpoints.',
    enabled: true,
    category: 'Transportation'
  },
  {
    id: 'faq-58',
    question: 'What are the exact check-in and check-out times at BAIA?',
    keywords: 'baia checkin, checkout time, hours, 1 pm to 8 pm, 7 am to 11 am, late arrival',
    answer: 'At BAIA, official check-in is from 1:00 PM to 8:00 PM, and check-out is from 7:00 AM to 11:00 AM. Please inform BAIA of your expected arrival time in advance if arriving after 6:00 PM.',
    enabled: true,
    category: 'Check-in & Checkout'
  },
  {
    id: 'faq-59',
    question: 'What room types and lodging capacity does BAIA offer?',
    keywords: 'baia rooms, cottages, double room patio, deluxe suite sea view, capacity, private',
    answer: 'BAIA is an intimate beachfront boutique lodge featuring just 3 private guest cottages/rooms for maximum privacy and tranquility. Accommodations include Double Rooms with Patio (Queen Bed) and Deluxe Suites with Sea View (King Bed + Sofa Bed), featuring air-conditioning, private bathrooms, balconies/terraces, and ground-floor access.',
    enabled: true,
    category: 'Rooms'
  },
  {
    id: 'faq-60',
    question: 'What cuisines and dining options does the on-site "Baia Beach" restaurant serve?',
    keywords: 'baia beach restaurant, cuisine, italian, mediterranean, pizza, seafood, asian, cocktails, bar',
    answer: 'The on-site "Baia Beach" restaurant serves Italian, Mediterranean, Pizza, Seafood, Local Filipino, Asian, International, and Grill/BBQ dishes. It is open for Brunch, Lunch, Dinner, and Cocktail hour, offering a family-friendly and romantic beachfront ambience with an on-site bar and coffee house.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-61',
    question: 'What breakfast styles are served at BAIA?',
    keywords: 'baia breakfast, continental, full english, irish, asian breakfast, coffee maker',
    answer: 'BAIA offers Continental, Full English/Irish, and Asian breakfast options. All guest rooms also feature in-room tea/coffee makers, electric kettles, and coffee machines.',
    enabled: true,
    category: 'Food & Breakfast'
  },
  {
    id: 'faq-62',
    question: 'Can island hopping tour boats pick up guests directly in front of BAIA?',
    keywords: 'boat access, island hopping pickup, private beach, boat pier, beachfront access',
    answer: 'Yes! BAIA features direct private beach access on Penanindigan Beach with boat access right in front of the property, allowing island-hopping tour boats to pick guests up directly from the beach.',
    enabled: true,
    category: 'Tours & Activities'
  },
  {
    id: 'faq-63',
    question: 'Who manages BAIA and who are the key staff mentioned by guests?',
    keywords: 'baia manager, giacomo, sir ron, kat cath, owner, staff names, hospitality',
    answer: 'BAIA is managed by Giacomo (the heart and soul of the lodge), along with welcoming staff members Sir Ron and Kat/Cath, known for personal, attentive hospitality and high guest satisfaction (rated 9.4/10).',
    enabled: true,
    category: 'Property'
  },
  {
    id: 'faq-64',
    question: 'What are BAIA’s child, extra bed, pet, and event policies?',
    keywords: 'extra bed price, 800 php, children 13+, no cribs, pets allowed, parties allowed',
    answer: 'Children over 13 are welcome (charged as adults from 18+). Extra beds are available upon request for ₱800 per person/night. Cribs are not available. Pets, parties/events, and bachelor/bachelorette parties are strictly not allowed to maintain a quiet, peaceful sanctuary.',
    enabled: true,
    category: 'Policies'
  },
  {
    id: 'faq-65',
    question: 'What resort facilities, amenities, and activities are available on-site at BAIA?',
    keywords: 'baia amenities, netflix, board games, snorkeling, massage, beach chairs, umbrellas, bicycle rental, parking',
    answer: 'BAIA provides a private beach area with sun loungers and umbrellas, sun deck, lush garden, free on-site private parking, free fiber Wi-Fi, streaming service (Netflix), board games, massage services, snorkeling, canoeing, bicycle rental, walking/bike tours, and movie nights.',
    enabled: true,
    category: 'Amenities'
  },
  {
    id: 'faq-66',
    question: 'What languages are spoken by the staff at BAIA?',
    keywords: 'languages spoken, english, spanish, italian, filipino, tagalog',
    answer: 'Staff at BAIA speak English, Spanish, Italian, and Filipino.',
    enabled: true,
    category: 'Property'
  },
  {
    id: 'faq-67',
    question: 'Which specific beach is BAIA located on, and what landmarks are nearby?',
    keywords: 'penanindigan beach, new capari beach, distance airport, marina terrace, mango bar',
    answer: 'BAIA is located directly on Penanindigan Beach (4 meters away). Nearby spots include New Capari Beach (600m), San Vicente Airport / SWO (5 km), Marina Terrace Restaurant (3 km), and Mango Bar & Resto (3.1 km).',
    enabled: true,
    category: 'Local Area'
  }
];
