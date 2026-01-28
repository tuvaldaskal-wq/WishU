import { Wishlist } from '../components/gifts/Wishlist';
import { AdsCarousel } from '../components/dashboard/AdsCarousel';
import { useSearch } from '../context/SearchContext';

const MyWall = () => {
    // const { userProfile } = useAuth();
    const { searchQuery } = useSearch();

    return (
        <div className="bg-white font-sans">
            {/* 3. Carousel (Full Width) */}
            <div className="w-full mb-6 relative z-0">
                <AdsCarousel fullWidth />
            </div>

            {/* Main content (Floating Gifts) */}
            <main className="px-6 relative z-0">
                <Wishlist showFavorites={false} searchQuery={searchQuery} />
            </main>
        </div>
    );
};

export default MyWall;

