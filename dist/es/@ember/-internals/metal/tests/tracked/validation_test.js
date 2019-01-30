var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { computed, defineProperty, get, set, tagForProperty, tracked } from '../..';
import { EMBER_METAL_TRACKED_PROPERTIES } from '@ember/canary-features';
import { AbstractTestCase, moduleFor } from 'internal-test-helpers';
if (EMBER_METAL_TRACKED_PROPERTIES) {
    moduleFor('@tracked get validation', class extends AbstractTestCase {
        [`@test validators for tracked getters with dependencies should invalidate when the dependencies invalidate`](assert) {
            class Tracked {
                constructor(first, last) {
                    this.first = undefined;
                    this.last = undefined;
                    this.first = first;
                    this.last = last;
                }
                get full() {
                    return `${this.first} ${this.last}`;
                }
            }
            __decorate([
                tracked
            ], Tracked.prototype, "first", void 0);
            __decorate([
                tracked
            ], Tracked.prototype, "last", void 0);
            __decorate([
                tracked
            ], Tracked.prototype, "full", null);
            let obj = new Tracked('Tom', 'Dale');
            let tag = tagForProperty(obj, 'full');
            let snapshot = tag.value();
            let full = obj.full;
            assert.equal(full, 'Tom Dale', 'The full name starts correct');
            assert.equal(tag.validate(snapshot), true);
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
            obj.first = 'Thomas';
            assert.equal(tag.validate(snapshot), false);
            assert.equal(obj.full, 'Thomas Dale');
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
        }
        [`@test interaction with Ember object model (tracked property depending on Ember property)`](assert) {
            class Tracked {
                constructor(name) {
                    this.name = name;
                }
                get full() {
                    return `${get(this.name, 'first')} ${get(this.name, 'last')}`;
                }
            }
            __decorate([
                tracked
            ], Tracked.prototype, "name", void 0);
            __decorate([
                tracked
            ], Tracked.prototype, "full", null);
            let tom = { first: 'Tom', last: 'Dale' };
            let obj = new Tracked(tom);
            let tag = tagForProperty(obj, 'full');
            let snapshot = tag.value();
            let full = obj.full;
            assert.equal(full, 'Tom Dale');
            assert.equal(tag.validate(snapshot), true);
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
            set(tom, 'first', 'Thomas');
            assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember set');
            assert.equal(obj.full, 'Thomas Dale');
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
        }
        [`@test interaction with Ember object model (Ember computed property depending on tracked property)`](assert) {
            class EmberObject {
                constructor(name) {
                    this.name = name;
                }
            }
            defineProperty(EmberObject.prototype, 'full', computed('name', function () {
                let name = get(this, 'name');
                return `${name.first} ${name.last}`;
            }));
            class Name {
                constructor(first, last) {
                    this.first = first;
                    this.last = last;
                }
            }
            __decorate([
                tracked
            ], Name.prototype, "first", void 0);
            __decorate([
                tracked
            ], Name.prototype, "last", void 0);
            let tom = new Name('Tom', 'Dale');
            let obj = new EmberObject(tom);
            let tag = tagForProperty(obj, 'full');
            let snapshot = tag.value();
            let full = get(obj, 'full');
            assert.equal(full, 'Tom Dale');
            assert.equal(tag.validate(snapshot), true);
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
            tom.first = 'Thomas';
            assert.equal(tag.validate(snapshot), false, 'invalid after setting with tracked properties');
            assert.equal(get(obj, 'full'), 'Thomas Dale');
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
        }
        ['@test interaction with the Ember object model (paths going through tracked properties)'](assert) {
            let self;
            class EmberObject {
                constructor(contact) {
                    this.contact = contact;
                    self = this;
                }
            }
            defineProperty(EmberObject.prototype, 'full', computed('contact.name.first', 'contact.name.last', function () {
                let contact = get(self, 'contact');
                return `${get(contact.name, 'first')} ${get(contact.name, 'last')}`;
            }));
            class Contact {
                constructor(name) {
                    this.name = undefined;
                    this.name = name;
                }
            }
            __decorate([
                tracked
            ], Contact.prototype, "name", void 0);
            class EmberName {
                constructor(first, last) {
                    this.first = first;
                    this.last = last;
                }
            }
            let tom = new EmberName('Tom', 'Dale');
            let contact = new Contact(tom);
            let obj = new EmberObject(contact);
            let tag = tagForProperty(obj, 'full');
            let snapshot = tag.value();
            let full = get(obj, 'full');
            assert.equal(full, 'Tom Dale');
            assert.equal(tag.validate(snapshot), true);
            snapshot = tag.value();
            assert.equal(tag.validate(snapshot), true);
            set(tom, 'first', 'Thomas');
            assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
            assert.equal(get(obj, 'full'), 'Thomas Dale');
            snapshot = tag.value();
            tom = contact.name = new EmberName('T', 'Dale');
            assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
            assert.equal(get(obj, 'full'), 'T Dale');
            snapshot = tag.value();
            set(tom, 'first', 'Tizzle');
            assert.equal(tag.validate(snapshot), false, 'invalid after setting with Ember.set');
            assert.equal(get(obj, 'full'), 'Tizzle Dale');
        }
    });
}
