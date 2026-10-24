import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateCampaign from './CreateCampaign';
import { campaignService } from '../services/campaignService';
import toast from 'react-hot-toast';

export default function EditCampaign() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [initialData, setInitialData] = useState<any | null>(null);

    useEffect(() => {
        const fetchCampaign = async () => {
            if (!id) return;
            try {
                const res = await campaignService.getCampaignDetails(id);
                const project = res.data?.campaign || (res as any)?.campaign || (res as any)?.data || res;

                if (!project) {
                    toast.error("Campaign not found.");
                    navigate('/dashboard');
                    return;
                }

                setInitialData(project);
            } catch (err: any) {
                console.error(err);
                toast.error(err?.message || "Failed to load campaign.");
                navigate('/dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchCampaign();
    }, [id, navigate]);

    const handleUpdate = async (data: any) => {
        if (!id) return;
        try {
            await campaignService.updateCampaign(id, data);
            toast.success("Campaign updated successfully!");
            navigate('/dashboard');
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || "Failed to update campaign.");
        }
    };

    if (loading) return <div className="p-10 text-center text-[#0F534A] font-black uppercase font-headline">Loading campaign...</div>;
    if (!initialData) return <div className="p-10 text-center text-[#F4002C] font-black uppercase font-headline">Campaign not found</div>;

    return (
        <CreateCampaign
            initialData={initialData}
            onBack={() => navigate('/dashboard')}
            onSubmit={handleUpdate}
        />
    );
}
