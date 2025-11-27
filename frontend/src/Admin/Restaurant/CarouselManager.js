import React from 'react';
import axios from 'axios';

function CarouselManager() {
  const [combos, setCombos] = React.useState([]);
  const [foodItems, setFoodItems] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [showAddPopup, setShowAddPopup] = React.useState(false);
  const [editingCombo, setEditingCombo] = React.useState(null);
  const [showEditPopup, setShowEditPopup] = React.useState(false);

  const [formData, setFormData] = React.useState({
    title: '',
    description: '',
    price: '',
    img: '',
    meal: '',
    snack: '',
    beverage: '',
    dessert: ''
  });

  const fetchCombos = React.useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/carousel/combos`);
      setCombos(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch combos:', err);
      setCombos([]);
    }
  }, []);

  const fetchFoodItems = React.useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food`);
      let all = [];
      if (res.data && typeof res.data === 'object') {
        Object.values(res.data).forEach(arr => {
          if (Array.isArray(arr)) all = all.concat(arr);
        });
      }
      setFoodItems(all.filter(f => f.available !== false));
    } catch (err) {
      console.error('Failed to fetch food items:', err);
      setFoodItems([]);
    }
  }, []);

  // Fetch combos and food items on mount
  React.useEffect(() => {
    fetchCombos();
    fetchFoodItems();
  }, [fetchCombos, fetchFoodItems]);

  const classifyFood = (food) => {
    if (!food || !food.category) return 'meal';
    const c = food.category.toLowerCase();
    if (c.includes('bever') || c.includes('drink') || c.includes('juice') || c.includes('soda') || c.includes('tea') || c.includes('coffee')) return 'beverage';
    if (c.includes('dessert')) return 'dessert';
    if (c.includes('snack') || c.includes('side')) return 'snack';
    return 'meal';
  };

  const getMealItems = () => foodItems.filter(f => {
    const c = (f.category || '').toLowerCase();
    return !c.includes('bever') && !c.includes('drink') && !c.includes('dessert') && !c.includes('snack') && !c.includes('side');
  });

  const getSnackItems = () => foodItems.filter(f => classifyFood(f) === 'snack');
  const getBeverageItems = () => foodItems.filter(f => classifyFood(f) === 'beverage');
  const getDessertItems = () => foodItems.filter(f => classifyFood(f) === 'dessert');

  const getMealImageByName = (mealName) => {
    const meal = foodItems.find(f => f.name === mealName);
    return meal?.img || '';
  };

  const getFoodItemByName = (name) => {
    return foodItems.find(f => f.name === name);
  };

  const autoGenerateComboDetails = (meal, snack, beverage, dessert) => {
    const mealItem = getFoodItemByName(meal);
    const snackItem = getFoodItemByName(snack);
    const beverageItem = getFoodItemByName(beverage);
    const dessertItem = getFoodItemByName(dessert);

    // Generate title from all items
    const items = [meal, snack, beverage, dessert].filter(Boolean);
    const title = items.join(' & ');

    // Generate description from all items
    const description = items.join(', ');

    // Calculate total price
    const price = (mealItem?.price || 0) + (snackItem?.price || 0) + (beverageItem?.price || 0) + (dessertItem?.price || 0);

    return { title, description, price };
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      price: '',
      img: '',
      meal: '',
      snack: '',
      beverage: '',
      dessert: ''
    });
    setEditingCombo(null);
  };

  const handleAddClick = () => {
    resetForm();
    setShowAddPopup(true);
  };

  const handleEditClick = (combo) => {
    setEditingCombo(combo);
    setFormData({
      title: combo.title || '',
      description: combo.description || '',
      price: combo.price || '',
      img: combo.img || '',
      meal: combo.items?.find(it => it.category === 'meal')?.name || '',
      snack: combo.items?.find(it => it.category === 'snack')?.name || '',
      beverage: combo.items?.find(it => it.category === 'beverage')?.name || '',
      dessert: combo.items?.find(it => it.category === 'dessert')?.name || ''
    });
    setShowEditPopup(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        img: formData.img,
        items: [
          formData.meal && { name: formData.meal, category: 'meal' },
          formData.snack && { name: formData.snack, category: 'snack' },
          formData.beverage && { name: formData.beverage, category: 'beverage' },
          formData.dessert && { name: formData.dessert, category: 'dessert' }
        ].filter(Boolean)
      };

      if (editingCombo) {
        await axios.put(`${process.env.REACT_APP_API_URL}/api/carousel/combos/${editingCombo._id}`, payload);
        setMessage('Combo updated successfully!');
        setShowEditPopup(false);
      } else {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/carousel/combos`, payload);
        setMessage('Combo added successfully!');
        setShowAddPopup(false);
      }

      resetForm();
      fetchCombos();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (comboId) => {
    if (!window.confirm('Are you sure you want to delete this combo?')) return;

    setLoading(true);
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/api/carousel/combos/${comboId}`);
      setMessage('Combo deleted successfully!');
      fetchCombos();
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-amber-900">Manage Carousel Combos</h3>
        <button
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 flex items-center space-x-2"
          onClick={handleAddClick}
          disabled={loading}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Combo</span>
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl text-center font-semibold ${
          message.includes('success') || message.includes('updated') || message.includes('deleted')
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {combos.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <p>No combos created yet. Click "Add Combo" to get started.</p>
          </div>
        ) : (
          combos.map(combo => (
            <div key={combo._id} className="border border-amber-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
              <img src={combo.img} alt={combo.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <h4 className="text-lg font-bold text-amber-900 mb-2">{combo.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{combo.description}</p>
                <div className="mb-3 text-sm text-amber-700">
                  <div>₱{combo.price}</div>
                  <div className="mt-2 space-y-1">
                    {combo.items?.map((item, idx) => (
                      <div key={idx} className="text-xs bg-amber-50 px-2 py-1 rounded capitalize">
                        {item.category}: {item.name}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    className="flex-1 px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold hover:bg-amber-600 transition-colors text-sm"
                    onClick={() => handleEditClick(combo)}
                    disabled={loading}
                  >
                    Edit
                  </button>
                  <button
                    className="flex-1 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm"
                    onClick={() => handleDelete(combo._id)}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Popup */}
      {(showAddPopup || showEditPopup) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-amber-200">
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6">
              <h3 className="text-2xl font-bold text-white">
                {editingCombo ? 'Edit Combo' : 'Add New Combo'}
              </h3>
            </div>
            <div className="p-6 max-h-[50vh] overflow-y-auto">
              <form className="space-y-4" onSubmit={handleSave}>
                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Title</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-amber-900 font-semibold mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200 resize-none"
                    rows="2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-amber-900 font-semibold mb-2">Image URL</label>
                    <input
                      type="text"
                      value={formData.img}
                      onChange={e => setFormData({ ...formData, img: e.target.value })}
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="border-t border-amber-200 pt-4 mt-4">
                  <h4 className="text-amber-900 font-semibold mb-3">Combo Items</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-amber-900 font-semibold mb-2">Meal (Breakfast/Lunch/Dinner)</label>
                      <select
                        value={formData.meal}
                        onChange={e => {
                          const mealName = e.target.value;
                          const mealImage = getMealImageByName(mealName);
                          const { title, description, price } = autoGenerateComboDetails(
                            mealName,
                            formData.snack,
                            formData.beverage,
                            formData.dessert
                          );
                          setFormData({ 
                            ...formData, 
                            meal: mealName,
                            img: mealImage,
                            title,
                            description,
                            price: price.toString()
                          });
                        }}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                      >
                        <option value="">Select a meal</option>
                        {getMealItems().map(item => (
                          <option key={item._id} value={item.name}>
                            {item.name} (₱{item.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-900 font-semibold mb-2">Snack</label>
                      <select
                        value={formData.snack}
                        onChange={e => {
                          const snackName = e.target.value;
                          const { title, description, price } = autoGenerateComboDetails(
                            formData.meal,
                            snackName,
                            formData.beverage,
                            formData.dessert
                          );
                          setFormData({ 
                            ...formData, 
                            snack: snackName,
                            title,
                            description,
                            price: price.toString()
                          });
                        }}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                      >
                        <option value="">Select a snack</option>
                        {getSnackItems().map(item => (
                          <option key={item._id} value={item.name}>
                            {item.name} (₱{item.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-900 font-semibold mb-2">Beverage</label>
                      <select
                        value={formData.beverage}
                        onChange={e => {
                          const beverageName = e.target.value;
                          const { title, description, price } = autoGenerateComboDetails(
                            formData.meal,
                            formData.snack,
                            beverageName,
                            formData.dessert
                          );
                          setFormData({ 
                            ...formData, 
                            beverage: beverageName,
                            title,
                            description,
                            price: price.toString()
                          });
                        }}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                      >
                        <option value="">Select a beverage</option>
                        {getBeverageItems().map(item => (
                          <option key={item._id} value={item.name}>
                            {item.name} (₱{item.price})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-amber-900 font-semibold mb-2">Dessert</label>
                      <select
                        value={formData.dessert}
                        onChange={e => {
                          const dessertName = e.target.value;
                          const { title, description, price } = autoGenerateComboDetails(
                            formData.meal,
                            formData.snack,
                            formData.beverage,
                            dessertName
                          );
                          setFormData({ 
                            ...formData, 
                            dessert: dessertName,
                            title,
                            description,
                            price: price.toString()
                          });
                        }}
                        required
                        className="w-full px-4 py-3 rounded-xl border-2 border-amber-200 bg-amber-50 text-amber-900 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all duration-200"
                      >
                        <option value="">Select a dessert</option>
                        {getDessertItems().map(item => (
                          <option key={item._id} value={item.name}>
                            {item.name} (₱{item.price})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4 border-t border-amber-200">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold shadow-lg hover:from-amber-600 hover:to-orange-600 transition-all duration-200 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Combo'}
                  </button>
                  <button
                    type="button"
                    className="px-8 py-3 rounded-xl border-2 border-amber-300 bg-white text-amber-700 font-semibold hover:bg-amber-50 transition-colors"
                    onClick={() => {
                      setShowAddPopup(false);
                      setShowEditPopup(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CarouselManager;
