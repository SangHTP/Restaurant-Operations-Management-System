
import { useCallback, useEffect, useState } from 'react';
import {
    createCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from '../../api/menuApi';

export default function CategoryManagement() {
    const [categories, setCategories] = useState([]);
    const [categoryName, setCategoryName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const loadCategories = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const result = await getCategories();
            setCategories(result);
        } catch (err) {
            setError(
                `${err.message}. Hãy kiểm tra backend tại http://localhost:5173.`
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    function resetForm() {
        setCategoryName('');
        setEditingId(null);
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const name = categoryName.trim();

        if (!name) {
            setError('Vui lòng nhập tên danh mục.');
            return;
        }

        if (name.length > 100) {
            setError('Tên danh mục không được vượt quá 100 ký tự.');
            return;
        }

        setSaving(true);
        setError('');
        setNotice('');

        try {
            if (editingId !== null) {
                await updateCategory(editingId, name);
                setNotice('Cập nhật danh mục thành công.');
            } else {
                await createCategory(name);
                setNotice('Tạo danh mục thành công.');
            }

            resetForm();
            await loadCategories();
        } catch (err) {
            setError(err.message || 'Không thể lưu danh mục.');
        } finally {
            setSaving(false);
        }
    }

    function handleEdit(category) {
        setEditingId(category.categoryID);
        setCategoryName(category.categoryName ?? '');
        setError('');
        setNotice('');

        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    }

    async function handleDelete(category) {
        const id = category.categoryID;
        const name = category.categoryName;

        const confirmed = window.confirm(
            `Bạn có chắc muốn xóa danh mục "${name}" (ID ${id}) không?`
        );

        if (!confirmed) return;

        setDeletingId(id);
        setError('');
        setNotice('');

        try {
            await deleteCategory(id);

            setNotice(`Đã xóa danh mục "${name}" thành công.`);

            if (editingId === id) {
                resetForm();
            }

            await loadCategories();
        } catch (err) {
            setError(
                err.message ||
                'Không thể xóa danh mục. Danh mục có thể đang được món ăn sử dụng.'
            );
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="mx-auto max-w-5xl space-y-6 px-2 py-4 sm:px-4">
            <section className="rounded-3xl border border-[#DCC8A8]/30 bg-[#081126] p-6 text-white shadow-xl sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#DCC8A8]">
                    Menu & Inventory
                </p>

                <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
                    Manage Food Categories
                </h1>

                <p className="mt-2 text-sm text-slate-300">
                    Quản lý danh mục món ăn trực tiếp qua API.
                </p>
            </section>

            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                    {error}
                </div>
            )}

            {notice && (
                <div
                    role="status"
                    className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                >
                    {notice}
                </div>
            )}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                    {editingId !== null
                        ? `Cập nhật danh mục #${editingId}`
                        : 'Tạo danh mục mới'}
                </h2>

                <form
                    onSubmit={handleSubmit}
                    className="mt-4 flex flex-col gap-3 sm:flex-row"
                >
                    <input
                        id="categoryName"
                        name="categoryName"
                        value={categoryName}
                        onChange={(event) =>
                            setCategoryName(event.target.value)
                        }
                        maxLength={100}
                        required
                        placeholder="Nhập tên danh mục, ví dụ: Đồ uống"
                        className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                    />

                    <button
                        disabled={saving}
                        type="submit"
                        className="rounded-xl bg-[#081126] px-5 py-3 text-sm font-bold text-[#DCC8A8] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving
                            ? 'Đang lưu...'
                            : editingId !== null
                                ? 'Lưu thay đổi'
                                : '+ Tạo danh mục'}
                    </button>

                    {editingId !== null && (
                        <button
                            type="button"
                            onClick={resetForm}
                            disabled={saving}
                            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                            Hủy
                        </button>
                    )}
                </form>

                <p className="mt-2 text-xs text-slate-500">
                    Tên danh mục tối đa 100 ký tự. ID được SQL Server tự tăng.
                </p>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="font-bold text-slate-900">
                            Danh sách danh mục
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Tổng số: {categories.length}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={loadCategories}
                        disabled={loading}
                        className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                    >
                        {loading ? 'Đang tải...' : '↻ Làm mới'}
                    </button>
                </div>

                {loading ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Đang tải danh mục từ API...
                    </div>
                ) : categories.length === 0 ? (
                    <div className="p-10 text-center text-sm text-slate-500">
                        Chưa có danh mục. Hãy tạo danh mục đầu tiên ở phía trên.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">ID</th>
                                    <th className="px-5 py-3">Tên danh mục</th>
                                    <th className="px-5 py-3 text-right">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {categories.map((category) => (
                                    <tr
                                        key={category.categoryID}
                                        className="hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4 font-mono text-slate-500">
                                            {category.categoryID}
                                        </td>

                                        <td className="px-5 py-4 font-semibold text-slate-900">
                                            {category.categoryName}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleEdit(category)
                                                    }
                                                    disabled={
                                                        deletingId !== null
                                                    }
                                                    className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-bold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                                >
                                                    Sửa
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDelete(category)
                                                    }
                                                    disabled={
                                                        deletingId !== null
                                                    }
                                                    className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                                                >
                                                    {deletingId ===
                                                        category.categoryID
                                                        ? 'Đang xóa...'
                                                        : 'Xóa'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}
